import { Nullable, Optional } from '@hirosystems/api-toolkit';
import { Static, Type } from '@sinclair/typebox';
import { PostConditionSchema } from './post-conditions';

const BaseTransactionSchema = Type.Object(
  {
    tx_id: Type.String({
      description: 'Transaction ID',
    }),
    nonce: Type.Integer({
      description:
        "Used for ordering the transactions originating from and paying from an account. The nonce ensures that a transaction is processed at most once. The nonce counts the number of times an account's owner(s) have authorized a transaction. The first transaction from an account will have a nonce value equal to 0, the second will have a nonce value equal to 1, and so on.",
    }),
    fee_rate: Type.String({
      description: 'Transaction fee as Integer string (64-bit unsigned integer).',
    }),
    sender_address: Type.String({
      description: 'Address of the transaction initiator',
    }),
    sponsor_nonce: Optional(Type.Integer()),
    sponsored: Type.Boolean({
      description: 'Denotes whether the originating account is the same as the paying account',
    }),
    sponsor_address: Optional(Type.String()),
    post_condition_mode: Type.Union([Type.Literal('allow'), Type.Literal('deny')]),
    post_conditions: Type.Array(PostConditionSchema),
    anchor_mode: Type.Union(
      [Type.Literal('on_chain_only'), Type.Literal('off_chain_only'), Type.Literal('any')],
      {
        description:
          '`on_chain_only`: the transaction MUST be included in an anchored block, `off_chain_only`: the transaction MUST be included in a microblock, `any`: the leader can choose where to include the transaction.',
      }
    ),
  },
  {
    additionalProperties: false,
    title: 'BaseTransaction',
    description:
      'Transaction properties that are available from a raw serialized transactions. These are available for transactions in the mempool as well as mined transactions.',
  }
);

const AbstractTransactionSchema = Type.Composite([
  BaseTransactionSchema,
  Type.Object(
    {
      tx_status: Type.Union(
        [
          Type.Literal('success'),
          Type.Literal('abort_by_response'),
          Type.Literal('abort_by_post_condition'),
        ],
        {
          description: 'Status of the transaction',
        }
      ),
      receipt_time: Type.Number({
        description:
          'A unix timestamp (in seconds) indicating when the transaction broadcast was received by the node.',
      }),
      receipt_time_iso: Type.String({
        description:
          'An ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) timestamp indicating when the transaction broadcast was received by the node.',
      }),
    },
    {
      additionalProperties: false,
      title: 'AbstractTransaction',
      description:
        'Abstract transaction. This schema makes up all properties common between all Stacks 2.0 transaction types',
    }
  ),
]);

export const TokenTransferTransactionSchema = Type.Composite([
  AbstractTransactionSchema,
  Type.Object(
    {
      tx_type: Type.Literal('token_transfer'),
      token_transfer: Type.Object({
        recipient_address: Type.String(),
        amount: Type.String({
          description: 'Transfer amount as Integer string (64-bit unsigned integer)',
        }),
        memo: Type.String({
          description:
            'Hex encoded arbitrary message, up to 34 bytes length (should try decoding to an ASCII string)',
        }),
      }),
    },
    {
      additionalProperties: false,
      title: 'TokenTransferTransaction',
      description: 'Metadata associated with token-transfer type transactions',
    }
  ),
]);
export type TokenTransferTransaction = Static<typeof TokenTransferTransactionSchema>;

export const SmartContractTransactionSchema = Type.Composite([
  AbstractTransactionSchema,
  Type.Object(
    {
      tx_type: Type.Literal('smart_contract'),
      smart_contract: Type.Object({
        clarity_version: Nullable(
          Type.Number({
            description:
              'The Clarity version of the contract, only specified for versioned contract transactions, otherwise null',
          })
        ),
        contract_id: Type.String({
          description: 'Contract identifier formatted as `<principaladdress>.<contract_name>`',
        }),
        source_code: Type.String({
          description: 'Clarity code of the smart contract being deployed',
        }),
      }),
    },
    {
      additionalProperties: false,
      title: 'SmartContractTransaction',
      description:
        'Metadata associated with a contract-deploy type transaction. https://github.com/blockstack/stacks-blockchain/blob/master/sip/sip-005-blocks-and-transactions.md#type-1-instantiating-a-smart-contract',
    }
  ),
]);
export type SmartContractTransaction = Static<typeof SmartContractTransactionSchema>;

export const ContractCallTransactionSchema = Type.Composite([
  AbstractTransactionSchema,
  Type.Object(
    {
      tx_type: Type.Literal('contract_call'),
      contract_call: Type.Object({
        contract_id: Type.String({
          description: 'Contract identifier formatted as `<principaladdress>.<contract_name>`',
        }),
        function_name: Type.String({
          description: 'Name of the Clarity function to be invoked',
        }),
        function_signature: Type.String({
          description:
            'Function definition, including function name and type as well as parameter names and types',
        }),
        function_args: Optional(
          Type.Array(
            Type.Object(
              {
                hex: Type.String(),
                repr: Type.String(),
                name: Type.String(),
                type: Type.String(),
              },
              {
                additionalProperties: false,
                description: 'List of arguments used to invoke the function',
              }
            )
          )
        ),
      }),
    },
    {
      additionalProperties: false,
      title: 'ContractCallTransaction',
      description: 'Metadata associated with a contract-call type transaction',
    }
  ),
]);
export type ContractCallTransaction = Static<typeof ContractCallTransactionSchema>;

export const PoisonMicroblockTransactionSchema = Type.Composite([
  AbstractTransactionSchema,
  Type.Object(
    {
      tx_type: Type.Literal('poison_microblock'),
      poison_microblock: Type.Object({
        microblock_header_1: Type.String({
          description: 'Hex encoded microblock header',
        }),
        microblock_header_2: Type.String({
          description: 'Hex encoded microblock header',
        }),
      }),
    },
    {
      additionalProperties: false,
      title: 'PoisonMicroblockTransaction',
      description: 'Metadata associated with a poison-microblock type transaction',
    }
  ),
]);
export type PoisonMicroblockTransaction = Static<typeof PoisonMicroblockTransactionSchema>;

export const CoinbaseTransactionSchema = Type.Composite([
  AbstractTransactionSchema,
  Type.Object(
    {
      tx_type: Type.Literal('coinbase'),
      coinbase_payload: Type.Object({
        data: Type.String({
          type: 'string',
          description: "Hex encoded 32-byte scratch space for block leader's use",
        }),
        alt_recipient: Optional(
          Nullable(
            Type.String({
              description:
                'A principal that will receive the miner rewards for this coinbase transaction. Can be either a standard principal or contract principal. Only specified for `coinbase-to-alt-recipient` transaction types, otherwise null.',
            })
          )
        ),
        vrf_proof: Optional(
          Nullable(
            Type.String({
              description: 'Hex encoded 80-byte VRF proof',
            })
          )
        ),
      }),
    },
    {
      additionalProperties: false,
      title: 'CoinbaseTransaction',
      description: 'Metadata associated with a coinbase type transaction',
    }
  ),
]);
export type CoinbaseTransaction = Static<typeof CoinbaseTransactionSchema>;

export const TenureChangeTransactionSchema = Type.Composite([
  AbstractTransactionSchema,
  Type.Object(
    {
      tx_type: Type.Literal('tenure_change'),
      tenure_change_payload: Type.Object({
        tenure_consensus_hash: Type.String({
          description:
            'Consensus hash of this tenure. Corresponds to the sortition in which the miner of this block was chosen.',
        }),
        prev_tenure_consensus_hash: Type.String({
          description:
            'Consensus hash of the previous tenure. Corresponds to the sortition of the previous winning block-commit.',
        }),
        burn_view_consensus_hash: Type.String({
          description:
            'Current consensus hash on the underlying burnchain. Corresponds to the last-seen sortition.',
        }),
        previous_tenure_end: Type.String({
          description: '(Hex string) Stacks Block hash',
        }),
        previous_tenure_blocks: Type.String({
          description: 'The number of blocks produced in the previous tenure.',
        }),
        cause: Type.Union([Type.Literal('block_found'), Type.Literal('extended')], {
          description:
            'Cause of change in mining tenure. Depending on cause, tenure can be ended or extended.',
        }),
        pubkey_hash: Type.String({
          description: '(Hex string) The ECDSA public key hash of the current tenure.',
        }),
      }),
    },
    {
      additionalProperties: false,
      title: 'TenureChangeTransaction',
      description: 'Describes representation of a Type 7 Stacks transaction: Tenure Change',
    }
  ),
]);
export type TenureChangeTransaction = Static<typeof TenureChangeTransactionSchema>;

export const TransactionSchema = Type.Union([
  TokenTransferTransactionSchema,
  SmartContractTransactionSchema,
  ContractCallTransactionSchema,
  PoisonMicroblockTransactionSchema,
  CoinbaseTransactionSchema,
  TenureChangeTransactionSchema,
]);
export type Transaction = Static<typeof TransactionSchema>;
