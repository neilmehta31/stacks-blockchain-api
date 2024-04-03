import { Nullable, Optional } from '@hirosystems/api-toolkit';
import { Static, Type } from '@sinclair/typebox';

export const ServerStatusResponseSchema = Type.Object(
  {
    server_version: Type.String({
      description: 'the server version that is currently running',
    }),
    status: Type.String({
      description: 'the current server status',
    }),
    pox_v1_unlock_height: Nullable(Type.Integer()),
    pox_v2_unlock_height: Nullable(Type.Integer()),
    pox_v3_unlock_height: Nullable(Type.Integer()),
    chain_tip: Optional(
      Type.Object({
        block_height: Type.Integer({
          description: 'the current block height',
        }),
        block_hash: Type.String({
          description: 'the current block hash',
        }),
        index_block_hash: Type.String({
          description: 'the current index block hash',
        }),
        microblock_hash: Optional(
          Type.String({
            description: 'the current microblock hash',
          })
        ),
        microblock_sequence: Optional(
          Type.Integer({
            description: 'the current microblock sequence number',
          })
        ),
        burn_block_height: Type.Integer({
          description: 'the current burn chain block height',
        }),
      })
    ),
  },
  { title: 'Api Status Response' }
);
export type ServerStatusResponse = Static<typeof ServerStatusResponseSchema>;
