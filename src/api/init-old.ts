// import { Server, createServer } from 'http';
// import { Socket } from 'net';
// import * as express from 'express';
// import { v4 as uuid } from 'uuid';
// import * as cors from 'cors';

// import { createTxRouter } from './routes/tx';
// import { createDebugRouter } from './routes/debug';
// import { createInfoRouter } from './routes/info';
// import { createContractRouter } from './routes/contract';
// import { createCoreNodeRpcProxyRouter } from './routes/core-node-rpc-proxy';
// import { createBlockRouter } from './routes/block';
// import { createFaucetRouter } from './routes/faucets';
// import { createAddressRouter } from './routes/address';
// import { createSearchRouter } from './routes/search';
// import { createStxSupplyRouter } from './routes/stx-supply';
// import { createRosettaNetworkRouter } from './routes/rosetta/network';
// import { createRosettaMempoolRouter } from './routes/rosetta/mempool';
// import { createRosettaBlockRouter } from './routes/rosetta/block';
// import { createRosettaAccountRouter } from './routes/rosetta/account';
// import { createRosettaConstructionRouter } from './routes/rosetta/construction';
// import { ChainID, apiDocumentationUrl, getChainIDNetwork } from '../helpers';
// import { InvalidRequestError } from '../errors';
// import { createBurnchainRouter } from './routes/burnchain';
// import { createBnsNamespacesRouter } from './routes/bns/namespaces';
// import { createBnsPriceRouter } from './routes/bns/pricing';
// import { createBnsNamesRouter } from './routes/bns/names';
// import { createBnsAddressesRouter } from './routes/bns/addresses';
// import * as pathToRegex from 'path-to-regexp';
// import * as expressListEndpoints from 'express-list-endpoints';
// import { createMiddleware as createPrometheusMiddleware } from '@promster/express';
// import { createMicroblockRouter } from './routes/microblock';
// import { createStatusRouter } from './routes/status';
// import { createTokenRouter } from './routes/tokens';
// import { createFeeRateRouter } from './routes/fee-rate';
// import { setResponseNonCacheable } from './controllers/express-cache-controller';

// import * as path from 'path';
// import * as fs from 'fs';
// import { PgStore } from '../datastore/pg-store';
// import { PgWriteStore } from '../datastore/pg-write-store';
// import { WebSocketTransmitter } from './routes/ws/web-socket-transmitter';
// import { createPoxEventsRouter } from './routes/pox';
// import { logger, loggerMiddleware } from '../logger';
// import {
//   SERVER_VERSION,
//   isPgConnectionError,
//   isProdEnv,
//   parseBoolean,
//   waiter,
// } from '@hirosystems/api-toolkit';
// import { createV2BlocksRouter } from './routes/v2/blocks';
// import { getReqQuery } from './query-helpers';
// import { createV2BurnBlocksRouter } from './routes/v2/burn-blocks';
// import { createMempoolRouter } from './routes/v2/mempool';
// import { createV2SmartContractsRouter } from './routes/v2/smart-contracts';
// import { createV2AddressesRouter } from './routes/v2/addresses';
// import { createPoxRouter } from './routes/v2/pox';

// export interface ApiServer {
//   expressApp: express.Express;
//   server: Server;
//   ws: WebSocketTransmitter;
//   address: string;
//   datastore: PgStore;
//   terminate: () => Promise<void>;
//   forceKill: () => Promise<void>;
// }

// export async function startApiServer(opts: {
//   datastore: PgStore;
//   writeDatastore?: PgWriteStore;
//   chainId: ChainID;
//   /** If not specified, this is read from the STACKS_BLOCKCHAIN_API_HOST env var. */
//   serverHost?: string;
//   /** If not specified, this is read from the STACKS_BLOCKCHAIN_API_PORT env var. */
//   serverPort?: number;
// }): Promise<ApiServer> {
//   // Setup extended API routes
//   app.use(
//     '/extended',
//     (() => {
//       const router = express.Router();
//       router.use(
//         '/v1',
//         (() => {
//           const v1 = express.Router();
//           v1.use('/block', createBlockRouter(datastore));
//           v1.use('/microblock', createMicroblockRouter(datastore));
//           v1.use('/burnchain', createBurnchainRouter(datastore));
//           v1.use('/contract', createContractRouter(datastore));
//           v1.use('/address', createAddressRouter(datastore, chainId));
//           v1.use('/search', createSearchRouter(datastore));
//           v1.use('/info', createInfoRouter(datastore));
//           v1.use('/stx_supply', createStxSupplyRouter(datastore));
//           v1.use('/debug', createDebugRouter(datastore));
//           // v1.use('/status', (req, res) =>
//           //   res.redirect(`${req.baseUrl.replace(/v1\/status/, '')}${getReqQuery(req)}`)
//           // );
//           v1.use('/fee_rate', createFeeRateRouter(datastore));
//           v1.use('/tokens', createTokenRouter(datastore));

//           // These could be defined in one route but a url reporting library breaks with regex in middleware paths
//           v1.use('/pox2', createPoxEventsRouter(datastore, 'pox2'));
//           v1.use('/pox3', createPoxEventsRouter(datastore, 'pox3'));
//           v1.use('/pox4', createPoxEventsRouter(datastore, 'pox4'));
//           const legacyPoxPathRouter: express.RequestHandler = (req, res) => {
//             // Redirect old pox routes paths to new one above
//             const newPath = req.path === '/' ? '/events' : req.path;
//             const baseUrl = req.baseUrl.replace(/(pox[\d])_events/, '$1');
//             const redirectPath = `${baseUrl}${newPath}${getReqQuery(req)}`;
//             return res.redirect(redirectPath);
//           };
//           v1.use('/pox2_events', legacyPoxPathRouter);
//           v1.use('/pox3_events', legacyPoxPathRouter);
//           v1.use('/pox4_events', legacyPoxPathRouter);

//           if (getChainIDNetwork(chainId) === 'testnet' && writeDatastore) {
//             v1.use('/faucets', createFaucetRouter(writeDatastore));
//           }
//           return v1;
//         })()
//       );
//       router.use(
//         '/v2',
//         (() => {
//           const v2 = express.Router();
//           v2.use('/blocks', createV2BlocksRouter(datastore));
//           v2.use('/burn-blocks', createV2BurnBlocksRouter(datastore));
//           v2.use('/smart-contracts', createV2SmartContractsRouter(datastore));
//           v2.use('/mempool', createMempoolRouter(datastore));
//           v2.use('/addresses', createV2AddressesRouter(datastore));
//           v2.use('/pox', createPoxRouter(datastore));
//           return v2;
//         })()
//       );
//       router.use(
//         '/beta',
//         (() => {
//           const beta = express.Router();
//           // Redirect to new endpoint for backward compatibility.
//           // TODO: remove this in the future
//           beta.use('/stacking/:pool_principal/delegations', (req, res) => {
//             const { pool_principal } = req.params;
//             const newPath = `/extended/v1/pox3/${pool_principal}/delegations${getReqQuery(req)}`;
//             return res.redirect(newPath);
//           });
//           return beta;
//         })()
//       );
//       return router;
//     })()
//   );

//   // Rosetta API -- https://www.rosetta-api.org
//   if (parseBoolean(process.env['STACKS_API_ENABLE_ROSETTA'] ?? '1'))
//     app.use(
//       '/rosetta/v1',
//       (() => {
//         const router = express.Router();
//         router.use(cors());
//         router.use('/network', createRosettaNetworkRouter(datastore, chainId));
//         router.use('/mempool', createRosettaMempoolRouter(datastore, chainId));
//         router.use('/block', createRosettaBlockRouter(datastore, chainId));
//         router.use('/account', createRosettaAccountRouter(datastore, chainId));
//         router.use('/construction', createRosettaConstructionRouter(datastore, chainId));
//         return router;
//       })()
//     );

//   // Setup legacy API v1 and v2 routes
//   app.use(
//     '/v1',
//     (() => {
//       const router = express.Router();
//       router.use(cors());
//       router.use('/namespaces', createBnsNamespacesRouter(datastore));
//       router.use('/names', createBnsNamesRouter(datastore, chainId));
//       router.use('/addresses', createBnsAddressesRouter(datastore, chainId));
//       return router;
//     })()
//   );

//   const server = createServer(app);

//   const serverSockets = new Set<Socket>();
//   server.on('connection', socket => {
//     serverSockets.add(socket);
//     socket.once('close', () => {
//       serverSockets.delete(socket);
//     });
//   });

//   const ws = new WebSocketTransmitter(datastore, server);
//   ws.connect();

//   await new Promise<void>((resolve, reject) => {
//     try {
//       server.once('error', error => {
//         reject(error);
//       });
//       server.listen(apiPort, apiHost, () => {
//         resolve();
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });

//   const terminate = async () => {
//     await new Promise<void>((resolve, reject) => {
//       logger.info('Closing WebSocket channels...');
//       ws.close(error => {
//         if (error) {
//           logger.error(error, 'Failed to gracefully close WebSocket channels');
//           reject(error);
//         } else {
//           logger.info('API WebSocket channels closed.');
//           resolve();
//         }
//       });
//     });
//     for (const socket of serverSockets) {
//       socket.destroy();
//     }
//     await new Promise<void>(resolve => {
//       logger.info('Closing API http server...');
//       server.close(() => {
//         logger.info('API http server closed.');
//         resolve();
//       });
//     });
//   };

//   const forceKill = async () => {
//     logger.info('Force closing API server...');
//     const [wsClosePromise, serverClosePromise] = [waiter(), waiter()];
//     ws.close(() => wsClosePromise.finish());
//     server.close(() => serverClosePromise.finish());
//     for (const socket of serverSockets) {
//       socket.destroy();
//     }
//     await Promise.allSettled([wsClosePromise, serverClosePromise]);
//   };

//   const addr = server.address();
//   if (addr === null) {
//     throw new Error('server missing address');
//   }
//   const addrStr = typeof addr === 'string' ? addr : `${addr.address}:${addr.port}`;
//   return {
//     expressApp: app,
//     server: server,
//     ws: ws,
//     address: addrStr,
//     datastore: datastore,
//     terminate: terminate,
//     forceKill: forceKill,
//   };
// }
