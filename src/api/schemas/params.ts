import { Type } from '@sinclair/typebox';

export const OffsetParam = Type.Integer({
  minimum: 0,
  title: 'Offset',
  description: 'Result offset',
});

export const LimitParam = Type.Integer({
  minimum: 1,
  maximum: 60,
  title: 'Limit',
  description: 'Results per page',
});

export const TransactionTypeParam = Type.Union([
  Type.Literal('coinbase'),
  Type.Literal('token_transfer'),
  Type.Literal('smart_contract'),
  Type.Literal('contract_call'),
  Type.Literal('poison_microblock'),
  Type.Literal('tenure_change'),
]);

export const UnanchoredParam = Type.Boolean();
