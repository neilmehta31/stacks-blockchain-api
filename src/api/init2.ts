import Fastify, { FastifyPluginAsync } from 'fastify';
import FastifyCors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import FastifyMetrics, { IFastifyMetrics } from 'fastify-metrics';
import { ChainID } from '@stacks/common';
import { PgStore } from '../datastore/pg-store';
import { PgWriteStore } from '../datastore/pg-write-store';
import { PINO_LOGGER_CONFIG, isProdEnv } from '@hirosystems/api-toolkit';

export async function startApiServer(args: {
  datastore: PgStore;
  writeDatastore?: PgWriteStore;
  chainId: ChainID;
}) {
  const fastify = Fastify({
    trustProxy: true,
    logger: PINO_LOGGER_CONFIG,
  }).withTypeProvider<TypeBoxTypeProvider>();

  fastify.decorate('db', args.datastore);
  fastify.decorate('writeDb', args.writeDatastore);
  if (isProdEnv) {
    await fastify.register(FastifyMetrics, { endpoint: null });
  }
  await fastify.register(FastifyCors);

  return fastify;
}
