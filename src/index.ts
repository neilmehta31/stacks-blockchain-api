import {
  getApiConfiguredChainID,
  getStacksNodeChainID,
  chainIdConfigurationCheck,
} from './helpers';
import * as sourceMapSupport from 'source-map-support';
import { startApiServer } from './api/init2';
import { startProfilerServer } from './inspector-util';
import { startEventServer } from './event-stream/event-server';
import { StacksCoreRpcClient } from './core-rpc/client';
import { createServer as createPrometheusServer } from '@promster/server';
import { OfflineDummyStore } from './datastore/offline-dummy-store';
import { Socket } from 'net';
import * as getopts from 'getopts';
import * as fs from 'fs';
import { injectC32addressEncodeCache } from './c32-addr-cache';
import { exportEventsAsTsv, importEventsFromTsv } from './event-replay/event-replay';
import { PgStore } from './datastore/pg-store';
import { PgWriteStore } from './datastore/pg-write-store';
import { registerMempoolPromStats } from './datastore/helpers';
import { logger } from './logger';
import {
  isProdEnv,
  numberToHex,
  parseBoolean,
  registerShutdownConfig,
  timeout,
} from '@hirosystems/api-toolkit';
import { ENV } from './env';

// ts-node has automatic source map support, avoid clobbering
if (!process.execArgv.some(r => r.includes('ts-node'))) {
  sourceMapSupport.install({ handleUncaughtExceptions: false });
}

injectC32addressEncodeCache();

registerShutdownConfig();

async function monitorCoreRpcConnection(): Promise<void> {
  const CORE_RPC_HEARTBEAT_INTERVAL = 5000; // 5 seconds
  let previouslyConnected = false;
  while (true) {
    const client = new StacksCoreRpcClient();
    try {
      await client.waitForConnection();
      if (!previouslyConnected) {
        logger.info(`Connection to Stacks core node API server at: ${client.endpoint}`);
      }
      previouslyConnected = true;
    } catch (error) {
      previouslyConnected = false;
      logger.warn(
        error,
        `[Non-critical] notice: failed to connect to node RPC server at ${client.endpoint}`
      );
    }
    await timeout(CORE_RPC_HEARTBEAT_INTERVAL);
  }
}

async function init(): Promise<void> {
  if (isProdEnv && !fs.existsSync('.git-info')) {
    throw new Error(
      'File not found: .git-info. This generated file is required to display the running API version in the ' +
        '`/extended/` endpoint. Please execute `npm run build` to regenerate it.'
    );
  }
  chainIdConfigurationCheck();
  const apiMode = ENV.STACKS_API_MODE;
  let dbStore: PgStore;
  let dbWriteStore: PgWriteStore;
  if (apiMode === 'offline') {
    dbStore = OfflineDummyStore;
    dbWriteStore = OfflineDummyStore;
  } else {
    dbStore = await PgStore.connect({
      usageName: `datastore-${apiMode}`,
    });
    dbWriteStore = await PgWriteStore.connect({
      usageName: `write-datastore-${apiMode}`,
      skipMigrations: apiMode === 'readonly',
    });
    registerMempoolPromStats(dbWriteStore.eventEmitter);
  }

  if (apiMode === 'default' || apiMode === 'writeonly') {
    const configuredChainID = getApiConfiguredChainID();
    const eventServer = await startEventServer({
      datastore: dbWriteStore,
      chainId: configuredChainID,
    });
    registerShutdownConfig({
      name: 'Event Server',
      handler: () => eventServer.closeAsync(),
      forceKillable: false,
    });

    if (!ENV.SKIP_STACKS_CHAIN_ID_CHECK) {
      const networkChainId = await getStacksNodeChainID();
      if (networkChainId !== configuredChainID) {
        const chainIdConfig = numberToHex(configuredChainID);
        const chainIdNode = numberToHex(networkChainId);
        const error = new Error(
          `The configured STACKS_CHAIN_ID does not match, configured: ${chainIdConfig}, stacks-node: ${chainIdNode}`
        );
        logger.error(error, error.message);
        throw error;
      }
    }
    monitorCoreRpcConnection().catch(error => {
      logger.error(error, 'Error monitoring RPC connection');
    });
  }

  if (['default', 'readonly', 'offline'].includes(apiMode)) {
    logger.info(`Initializing API server...`);
    const apiServer = await startApiServer({
      datastore: dbStore,
      writeDatastore: dbWriteStore,
      chainId: getApiConfiguredChainID(),
    });
    registerShutdownConfig({
      name: 'API Server',
      handler: async () => {
        await apiServer.close();
      },
      forceKillable: false,
    });
    await apiServer.listen({
      host: ENV.STACKS_BLOCKCHAIN_API_HOST,
      port: ENV.STACKS_BLOCKCHAIN_API_PORT,
    });
  }

  const profilerHttpServerPort = ENV.STACKS_PROFILER_PORT;
  if (profilerHttpServerPort) {
    const profilerServer = await startProfilerServer(profilerHttpServerPort);
    registerShutdownConfig({
      name: 'Profiler server',
      handler: () => profilerServer.close(),
      forceKillable: false,
    });
  }

  if (apiMode !== 'offline') {
    registerShutdownConfig({
      name: 'DB',
      handler: async () => {
        await dbStore.close();
        await dbWriteStore.close();
      },
      forceKillable: false,
    });
  }

  if (isProdEnv) {
    const prometheusServer = await createPrometheusServer({ port: 9153 });
    logger.info(`@promster/server started on port 9153.`);
    const sockets = new Set<Socket>();
    prometheusServer.on('connection', socket => {
      sockets.add(socket);
      socket.once('close', () => sockets.delete(socket));
    });
    registerShutdownConfig({
      name: 'Prometheus',
      handler: async () => {
        for (const socket of sockets) {
          socket.destroy();
          sockets.delete(socket);
        }
        await Promise.resolve(prometheusServer.close());
      },
      forceKillable: true,
    });
  }
}

function initApp() {
  init()
    .then(() => {
      logger.info('App initialized');
    })
    .catch(error => {
      logger.error(error, 'app failed to start');
      process.exit(1);
    });
}

function getProgramArgs() {
  // TODO: use a more robust arg parsing library that has built-in `--help` functionality
  const parsedOpts = getopts(process.argv.slice(2), {
    boolean: ['overwrite-file', 'wipe-db'],
  });
  const args = {
    operand: parsedOpts._[0],
    options: parsedOpts,
  } as
    | {
        operand: 'export-events';
        options: {
          ['file']?: string;
          ['overwrite-file']?: boolean;
        };
      }
    | {
        operand: 'import-events';
        options: {
          ['file']?: string;
          ['mode']?: string;
          ['wipe-db']?: boolean;
          ['force']?: boolean;
        };
      }
    | {
        operand: 'from-parquet-events';
        options: {
          ['new-burn-block']?: boolean;
          ['attachment-new']?: boolean;
          ['new-block']?: boolean;
          ['ids-path']?: string;
        };
      };
  return { args, parsedOpts };
}

async function handleProgramArgs() {
  const { args, parsedOpts } = getProgramArgs();
  if (args.operand === 'export-events') {
    await exportEventsAsTsv(args.options.file, args.options['overwrite-file']);
  } else if (args.operand === 'import-events') {
    await importEventsFromTsv(
      args.options.file,
      args.options.mode,
      args.options['wipe-db'],
      args.options.force
    );
  } else if (args.operand === 'from-parquet-events') {
    const { ReplayController } = await import('./event-replay/parquet-based/replay-controller');
    const replay = await ReplayController.init();
    await replay.prepare();
    await replay.do();
    await replay.finalize();
  } else if (parsedOpts._[0]) {
    throw new Error(`Unexpected program argument: ${parsedOpts._[0]}`);
  } else {
    initApp();
  }
}

void handleProgramArgs().catch(error => {
  console.error(error);
  const { args } = getProgramArgs();
  if (args.operand) {
    console.error(`${args.operand} process failed`);
  }
  process.exit(1);
});
