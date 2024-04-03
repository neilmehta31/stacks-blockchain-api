import Fastify, { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import FastifyCors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import FastifyMetrics from 'fastify-metrics';
import { ChainID } from '@stacks/common';
import { PgStore } from '../datastore/pg-store';
import { PgWriteStore } from '../datastore/pg-write-store';
import { PINO_LOGGER_CONFIG, SERVER_VERSION, isProdEnv } from '@hirosystems/api-toolkit';
import { Server } from 'http';
import { StatusRoutes } from './routes/status';

function addApiServerResponseHeader(request: FastifyRequest, reply: FastifyReply) {
  return reply.header(
    'X-API-Version',
    `${SERVER_VERSION.tag} (${SERVER_VERSION.branch}:${SERVER_VERSION.commit})`
  );
}

export const Api: FastifyPluginAsync<
  Record<never, never>,
  Server,
  TypeBoxTypeProvider
> = async fastify => {
  fastify.addHook('onSend', addApiServerResponseHeader);
  await fastify.register(StatusRoutes);
  // await fastify.register(InscriptionsRoutes);
  // await fastify.register(SatRoutes);
  // await fastify.register(StatsRoutes);
  // await fastify.register(Brc20Routes);
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
  await fastify.register(Api, { prefix: '/extended' });

  return fastify;
}
