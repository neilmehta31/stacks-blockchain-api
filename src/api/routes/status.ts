import { SERVER_VERSION, logger } from '@hirosystems/api-toolkit';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { Server } from 'http';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { ServerStatusResponse, ServerStatusResponseSchema } from '../schemas/responses';
import { handleChainTipCache } from '../controllers/cache';

export const StatusRoutes: FastifyPluginCallback<
  Record<never, never>,
  Server,
  TypeBoxTypeProvider
> = (fastify, options, done) => {
  const schema = {
    schema: {
      operationId: 'get_status',
      summary: 'API status',
      description:
        'Retrieves the running status of the Stacks Blockchain API, including the server version and current chain tip information.',
      tags: ['Info'],
      response: {
        200: ServerStatusResponseSchema,
      },
    },
  };
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    const response: ServerStatusResponse = {
      server_version: `stacks-blockchain-api ${SERVER_VERSION.tag} (${SERVER_VERSION.branch}:${SERVER_VERSION.commit})`,
      status: 'ready',
      pox_v1_unlock_height: null,
      pox_v2_unlock_height: null,
      pox_v3_unlock_height: null,
    };
    try {
      const poxForceUnlockHeights = await fastify.db.getPoxForceUnlockHeights();
      if (poxForceUnlockHeights.found) {
        response.pox_v1_unlock_height = poxForceUnlockHeights.result.pox1UnlockHeight;
        response.pox_v2_unlock_height = poxForceUnlockHeights.result.pox2UnlockHeight;
        response.pox_v3_unlock_height = poxForceUnlockHeights.result.pox3UnlockHeight;
      }
      const chainTip = await fastify.db.getChainTip(fastify.db.sql);
      if (chainTip.block_height > 0) {
        response.chain_tip = {
          block_height: chainTip.block_height,
          block_hash: chainTip.block_hash,
          index_block_hash: chainTip.index_block_hash,
          microblock_hash: chainTip.microblock_hash,
          microblock_sequence: chainTip.microblock_sequence,
          burn_block_height: chainTip.burn_block_height,
        };
      }
    } catch (error) {
      logger.warn(error, `Unable to retrieve status chain tip`);
    }
    await reply.send(response);
  };

  fastify.addHook('preHandler', handleChainTipCache);
  fastify.get('/', schema, handler);
  fastify.post('/', schema, handler);
  done();
};
