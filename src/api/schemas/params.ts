import { Type } from '@sinclair/typebox';
import { ResourceType, pagingQueryLimits } from '../pagination';

export const OffsetParam = (title?: string, description?: string) =>
  Type.Integer({
    minimum: 0,
    default: 0,
    title: title ?? 'Offset',
    description: description ?? 'Result offset',
  });

export const LimitParam = (resource: ResourceType, title?: string, description?: string) =>
  Type.Integer({
    minimum: 0,
    default: pagingQueryLimits[resource].defaultLimit,
    maximum: pagingQueryLimits[resource].maxLimit,
    title: title ?? 'Limit',
    description: description ?? 'Results per page',
  });

export const UnanchoredParamSchema = Type.Boolean({ default: false });

export const TransactionIdParamSchema = Type.RegExp(/^(0x)?[a-fA-F0-9]{64}$/i, {
  title: 'Transaction ID',
  description: 'Transaction ID',
  examples: ['0xf6bd5f4a7b26184a3466340b2e99fd003b4962c0e382a7e4b6a13df3dd7a91c6'],
});

export const BlockHashSchema = Type.RegExp(/^(0x)?[a-fA-F0-9]{64}$/i, {
  title: 'Block hash',
  description: 'Block hash',
  examples: ['0000000000000000000452773967cdd62297137cdaf79950c5e8bb0c62075133'],
});

export const BlockHeightSchema = Type.Integer({
  minimum: 0,
  title: 'Block height',
  description: 'Block height',
  examples: [777678],
});

export const BurnBlockHashParamSchema = Type.RegExp(/^(0x)?[a-fA-F0-9]{64}$/i, {
  title: 'Burn block hash',
  description: 'Burn block hash',
  examples: ['0000000000000000000452773967cdd62297137cdaf79950c5e8bb0c62075133'],
});

export const BurnBlockHeightParamSchema = Type.RegExp(/^[0-9]+$/, {
  title: 'Burn block height',
  description: 'Burn block height',
  examples: ['777678'],
});

export const AddressParamSchema = Type.RegExp(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{28,41}/, {
  title: 'STX Address',
  description: 'STX Address',
  examples: ['SP318Q55DEKHRXJK696033DQN5C54D9K2EE6DHRWP'],
});

export const SmartContractIdParamSchema = Type.RegExp(
  /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{28,41}\.[a-zA-Z]([a-zA-Z0-9]|[-_]){0,39}$/,
  {
    title: 'Smart Contract ID',
    description: 'Smart Contract ID',
    examples: ['SP000000000000000000002Q6VF78.pox-3'],
  }
);

export const PrincipalSchema = Type.Union([AddressParamSchema, SmartContractIdParamSchema]);

export enum Order {
  asc = 'asc',
  desc = 'desc',
}
export const OrderParamSchema = Type.Enum(Order, {
  title: 'Order',
  description: 'Results order',
});

export enum MempoolOrderBy {
  age = 'age',
  size = 'size',
  fee = 'fee',
}
export const MempoolOrderByParamSchema = Type.Enum(MempoolOrderBy, {
  title: 'Order By',
  description: 'Option to sort results by transaction age, size, or fee rate.',
});
