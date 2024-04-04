import { parseDbMempoolTx, searchTx, searchTxs, parseDbTx } from '../controllers/db-controller';
import { getPagingQueryLimit, ResourceType } from '../pagination';
import { Optional, PaginatedResponse, has0xPrefix } from '@hirosystems/api-toolkit';
import { Type, TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';
import { Server } from 'http';
import {
  handleChainTipCache,
  handleMempoolCache,
  handleTransactionCache,
} from '../controllers/cache';
import {
  AddressParamSchema,
  BlockHashSchema,
  BlockHeightSchema,
  LimitParam,
  MempoolOrderByParamSchema,
  OffsetParam,
  OrderParamSchema,
  PrincipalSchema,
  TransactionIdParamSchema,
  UnanchoredParamSchema,
} from '../schemas/params';
import { TransactionSchema, TransactionTypeSchema } from '../schemas/entities/transactions';
import {
  ErrorResponseSchema,
  MempoolStatsResponseSchema,
  RawTransactionResponseSchema,
  TransactionSearchResponseSchema,
} from '../schemas/responses';
import { MempoolTransactionSchema } from '../schemas/entities/mempool-transactions';
import {
  TransactionEventSchema,
  TransactionEventTypeSchema,
} from '../schemas/entities/transaction-events';

const ChainTipRoutes: FastifyPluginCallback<Record<never, never>, Server, TypeBoxTypeProvider> = (
  fastify,
  _,
  done
) => {
  fastify.addHook('preHandler', handleChainTipCache);

  fastify.get(
    '/',
    {
      schema: {
        operationId: 'get_transaction_list',
        summary: 'Get recent transactions',
        description: `Retrieves all recently mined transactions

          If using TypeScript, import typings for this response from our types package:
  
          \`import type { TransactionResults } from '@stacks/stacks-blockchain-api-types';\``,
        tags: ['Transactions'],
        querystring: Type.Object({
          offset: OffsetParam(),
          limit: LimitParam(ResourceType.Tx),
          type: Optional(Type.Array(TransactionTypeSchema)),
          unanchored: Optional(UnanchoredParamSchema),
        }),
        response: {
          200: PaginatedResponse(TransactionSchema, 'List of transactions'),
        },
      },
    },
    async (req, res) => {
      const limit = req.query.limit ?? getPagingQueryLimit(ResourceType.Tx, req.query.limit);
      const offset = req.query.offset ?? 0;
      const { results: txResults, total } = await fastify.db.getTxList({
        offset,
        limit,
        txTypeFilter: req.query.type ?? [],
        includeUnanchored: req.query.unanchored ?? false,
      });
      await res.send({
        limit,
        offset,
        total,
        results: txResults.map(tx => parseDbTx(tx)),
      });
    }
  );

  fastify.get(
    '/events',
    {
      schema: {
        operationId: 'get_filtered_events',
        summary: 'Transaction Events',
        description: `Retrieves the list of events filtered by principal (STX address or Smart Contract ID), transaction id or event types.
        The list of event types is ('smart_contract_log', 'stx_lock', 'stx_asset', 'fungible_token_asset', 'non_fungible_token_asset').`,
        tags: ['Transactions'],
        querystring: Type.Object({
          tx_id: Optional(TransactionIdParamSchema),
          address: Optional(PrincipalSchema),
          type: Optional(Type.Array(TransactionEventTypeSchema)),
          offset: OffsetParam(),
          limit: LimitParam(ResourceType.Event),
        }),
        response: {
          200: PaginatedResponse(TransactionEventSchema, 'List of events'),
        },
      },
    },
    async (req, res) => {
      // TODO: Figure this out
      // const principalOrTxId = parseAddressOrTxId(req, res, next);
      // const eventTypeFilter = parseEventTypeFilter(req, res, next);
      // const { results } = await fastify.db.getTransactionEvents({
      //   addressOrTxId: req.query.address,
      //   eventTypeFilter: req.query.type,
      //   offset: req.query.offset,
      //   limit: req.query.limit,
      // });
      // const response = { limit, offset, events: results.map(e => parseDbEvent(e)) };
      // await res.send(response);
    }
  );

  fastify.get(
    '/block/:block_hash',
    {
      schema: {
        deprecated: true,
        operationId: 'get_transactions_by_block_hash',
        summary: 'Transactions by block hash',
        description: `**NOTE:** This endpoint is deprecated in favor of [Get transactions by block](/api/get-transactions-by-block).

        Retrieves a list of all transactions within a block for a given block hash.`,
        tags: ['Transactions'],
        params: Type.Object({
          block_hash: BlockHashSchema,
        }),
        querystring: Type.Object({
          offset: OffsetParam(),
          limit: LimitParam(ResourceType.Tx),
        }),
        response: {
          200: PaginatedResponse(TransactionSchema, 'List of transactions'),
          404: ErrorResponseSchema,
        },
      },
    },
    async (req, res) => {
      const result = await fastify.db.getTxsFromBlock(
        { hash: req.params.block_hash },
        req.query.limit,
        req.query.offset
      );
      if (!result.found) {
        await res.status(404).send({ error: `no block found by hash ${req.params.block_hash}` });
        return;
      }
      const dbTxs = result.result;
      const results = dbTxs.results.map(dbTx => parseDbTx(dbTx));
      await res.send({
        limit: req.query.limit,
        offset: req.query.offset,
        total: dbTxs.total,
        results: results,
      });
    }
  );

  fastify.get(
    '/block_height/:height',
    {
      schema: {
        deprecated: true,
        operationId: 'get_transactions_by_block_height',
        summary: 'Transactions by block height',
        description: `**NOTE:** This endpoint is deprecated in favor of [Get transactions by block](/api/get-transactions-by-block).

        Retrieves all transactions within a block at a given height`,
        tags: ['Transactions'],
        params: Type.Object({
          height: BlockHeightSchema,
        }),
        querystring: Type.Object({
          offset: OffsetParam(),
          limit: LimitParam(ResourceType.Tx),
        }),
        response: {
          200: PaginatedResponse(TransactionSchema, 'List of transactions'),
          404: ErrorResponseSchema,
        },
      },
    },
    async (req, res) => {
      const result = await fastify.db.getTxsFromBlock(
        { height: req.params.height },
        req.query.limit,
        req.query.offset
      );
      if (!result.found) {
        await res.status(404).send({ error: `no block found at height ${req.params.height}` });
        return;
      }
      const dbTxs = result.result;
      const results = dbTxs.results.map(dbTx => parseDbTx(dbTx));
      await res.send({
        limit: req.query.limit,
        offset: req.query.offset,
        total: dbTxs.total,
        results: results,
      });
    }
  );

  done();
};

const MempoolRoutes: FastifyPluginCallback<Record<never, never>, Server, TypeBoxTypeProvider> = (
  fastify,
  options,
  done
) => {
  fastify.addHook('preHandler', handleMempoolCache);

  fastify.get(
    '/mempool',
    {
      schema: {
        operationId: 'get_mempool_transaction_list',
        summary: 'Get mempool transactions',
        description: `Retrieves all transactions that have been recently broadcast to the mempool. These are pending transactions awaiting confirmation.

        If you need to monitor new transactions, we highly recommend subscribing to [WebSockets or Socket.io](https://github.com/hirosystems/stacks-blockchain-api/tree/master/client) for real-time updates.`,
        tags: ['Transactions'],
        querystring: Type.Object({
          sender_address: Optional(AddressParamSchema),
          recipient_address: Optional(AddressParamSchema),
          address: Optional(AddressParamSchema),
          order_by: Optional(MempoolOrderByParamSchema),
          order: Optional(OrderParamSchema),
          unanchored: Optional(UnanchoredParamSchema),
          offset: OffsetParam(),
          limit: LimitParam(ResourceType.Tx),
        }),
        response: {
          200: PaginatedResponse(MempoolTransactionSchema, 'List of mempool transactions'),
        },
      },
    },
    async (req, res) => {
      const { results: txResults, total } = await fastify.db.getMempoolTxList({
        offset: req.query.offset,
        limit: req.query.limit,
        includeUnanchored: req.query.unanchored ?? false,
        orderBy: req.query.order_by,
        order: req.query.order,
        senderAddress: req.query.sender_address,
        recipientAddress: req.query.recipient_address,
        address: req.query.address,
      });
      const results = txResults.map(tx => parseDbMempoolTx(tx));
      await res.send({ limit: req.query.limit, offset: req.query.offset, total, results });
    }
  );

  fastify.get(
    '/mempool/dropped',
    {
      schema: {
        operationId: 'get_dropped_mempool_transaction_list',
        summary: 'Get dropped mempool transactions',
        description: `Retrieves all recently-broadcast transactions that have been dropped from the mempool.

        Transactions are dropped from the mempool if:
         * they were stale and awaiting garbage collection or,
         * were expensive, or
         * were replaced with a new fee`,
        tags: ['Transactions'],
        querystring: Type.Object({
          offset: OffsetParam(),
          limit: LimitParam(ResourceType.Tx),
        }),
        response: {
          200: PaginatedResponse(MempoolTransactionSchema, 'List of mempool transactions'),
        },
      },
    },
    async (req, res) => {
      const { results: txResults, total } = await fastify.db.getDroppedTxs({
        offset: req.query.offset,
        limit: req.query.limit,
      });
      const results = txResults.map(tx => parseDbMempoolTx(tx));
      await res.send({ offset: req.query.offset, limit: req.query.limit, total, results });
    }
  );

  fastify.get(
    '/mempool/stats',
    {
      schema: {
        operationId: 'get_mempool_transaction_stats',
        summary: 'Get statistics for mempool transactions',
        description: `Queries for transactions counts, age (by block height), fees (simple average), and size.
        All results broken down by transaction type and percentiles (p25, p50, p75, p95).`,
        tags: ['Transactions'],
        response: {
          200: MempoolStatsResponseSchema,
        },
      },
    },
    async (req, res) => {
      const queryResult = await fastify.db.getMempoolStats({ lastBlockCount: undefined });
      await res.send(queryResult);
    }
  );

  fastify.get(
    '/multiple',
    {
      schema: {
        operationId: 'get_tx_list_details',
        summary: 'Get list of details for transactions',
        description: `Retrieves a list of transactions for a given list of transaction IDs

        If using TypeScript, import typings for this response from our types package:

        \`import type { Transaction } from '@stacks/stacks-blockchain-api-types';\``,
        tags: ['Transactions'],
        querystring: Type.Object({
          tx_id: Type.Array(TransactionIdParamSchema),
          event_limit: LimitParam(ResourceType.Tx),
          event_offset: OffsetParam(),
          unanchored: Optional(UnanchoredParamSchema),
        }),
        response: {
          200: TransactionSearchResponseSchema,
        },
      },
    },
    async (req, res) => {
      const includeUnanchored = req.query.unanchored ?? false;
      const txQuery = await searchTxs(fastify.db, {
        txIds: req.query.tx_id,
        eventLimit: req.query.event_limit,
        eventOffset: req.query.event_offset,
        includeUnanchored,
      });
      await res.send(txQuery);
    }
  );

  done();
};

const TxRoutes: FastifyPluginCallback<Record<never, never>, Server, TypeBoxTypeProvider> = (
  fastify,
  _,
  done
) => {
  fastify.addHook('preHandler', handleTransactionCache);

  fastify.get(
    '/:tx_id',
    {
      schema: {
        operationId: 'get_transaction_by_id',
        summary: 'Get transaction',
        description: `Retrieves transaction details for a given transaction ID

        \`import type { Transaction } from '@stacks/stacks-blockchain-api-types';\``,
        tags: ['Transactions'],
        params: Type.Object({
          tx_id: TransactionIdParamSchema,
        }),
        querystring: Type.Object({
          event_limit: LimitParam(ResourceType.Tx),
          event_offset: OffsetParam(),
          unanchored: UnanchoredParamSchema,
        }),
        response: {
          200: Type.Union([TransactionSchema, MempoolTransactionSchema]),
          404: ErrorResponseSchema,
        },
      },
    },
    async (req, res) => {
      if (!has0xPrefix(req.params.tx_id)) {
        const baseURL = req.protocol + '://' + req.headers.host + '/';
        const url = new URL(req.url, baseURL);
        return res.redirect('/extended/v1/tx/0x' + req.params.tx_id + url.search);
      }
      const txQuery = await searchTx(fastify.db, {
        txId: req.params.tx_id,
        eventLimit: req.query.event_limit,
        eventOffset: req.query.event_offset,
        includeUnanchored: req.query.unanchored,
      });
      if (!txQuery.found) {
        await res
          .status(404)
          .send({ error: `could not find transaction by ID ${req.params.tx_id}` });
        return;
      }
      await res.send(txQuery.result);
    }
  );

  fastify.get(
    '/:tx_id/raw',
    {
      schema: {
        operationId: 'get_raw_transaction_by_id',
        summary: 'Get raw transaction',
        description: `Retrieves a hex encoded serialized transaction for a given ID`,
        tags: ['Transactions'],
        params: Type.Object({
          tx_id: TransactionIdParamSchema,
        }),
        querystring: Type.Object({
          event_limit: LimitParam(ResourceType.Tx),
          event_offset: OffsetParam(),
          unanchored: UnanchoredParamSchema,
        }),
        response: {
          200: RawTransactionResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (req, res) => {
      if (!has0xPrefix(req.params.tx_id)) {
        return res.redirect('/extended/v1/tx/0x' + req.params.tx_id + '/raw');
      }
      const rawTxQuery = await fastify.db.getRawTx(req.params.tx_id);
      if (rawTxQuery.found) {
        await res.send({
          raw_tx: rawTxQuery.result.raw_tx,
        });
      } else {
        await res
          .status(404)
          .send({ error: `could not find transaction by ID ${req.params.tx_id}` });
      }
    }
  );

  done();
};

export const V1TxRoutes: FastifyPluginAsync<
  Record<never, never>,
  Server,
  TypeBoxTypeProvider
> = async fastify => {
  await fastify.register(ChainTipRoutes);
  await fastify.register(MempoolRoutes);
  await fastify.register(TxRoutes);
};
