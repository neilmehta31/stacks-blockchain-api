import Fastify, { FastifyPluginAsync } from 'fastify';
import FastifyCors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import FastifyMetrics from 'fastify-metrics';
import { ChainID } from '@stacks/common';
import { PgStore } from '../datastore/pg-store';
import { PgWriteStore } from '../datastore/pg-write-store';
import { PINO_LOGGER_CONFIG, SERVER_VERSION, isProdEnv } from '@hirosystems/api-toolkit';
import { Server } from 'http';
import { StatusRoutes } from './routes/status';
import { DocsRoutes } from './routes/docs';

export const ApiV1: FastifyPluginAsync<
  Record<never, never>,
  Server,
  TypeBoxTypeProvider
> = async fastify => {
  // await fastify.register(StatusRoutes);
};

export const Api: FastifyPluginAsync<
  Record<never, never>,
  Server,
  TypeBoxTypeProvider
> = async fastify => {
  fastify.addHook('preHandler', async (request, reply) => {
    void reply.header(
      'X-API-Version',
      `${SERVER_VERSION.tag} (${SERVER_VERSION.branch}:${SERVER_VERSION.commit})`
    );
  });

  await fastify.register(DocsRoutes);
  await fastify.register(StatusRoutes);
  await fastify.register(ApiV1, { prefix: '/v1' });
};

export async function buildApiServer(args: {
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
  await fastify.register(FastifyCors, { exposedHeaders: ['X-API-Version'] });

  fastify.get('/', async (request, reply) => {
    await reply.redirect(301, '/extended');
  });
  await fastify.register(Api, { prefix: '/extended' });

  return fastify;
}
