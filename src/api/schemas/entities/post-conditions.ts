import { Type } from '@sinclair/typebox';

const PostConditionPrincipalSchema = Type.Union([
  Type.Object({
    type_id: Type.Literal('principal_origin'),
  }),
  Type.Object({
    type_id: Type.Literal('principal_standard'),
    address: Type.String(),
  }),
  Type.Object({
    type_id: Type.Literal('principal_contract'),
    address: Type.String(),
    contract_name: Type.String(),
  }),
]);

const PostConditionFungibleConditionCodeSchema = Type.Union([
  Type.Literal('sent_equal_to'),
  Type.Literal('sent_greater_than'),
  Type.Literal('sent_greater_than_or_equal_to'),
  Type.Literal('sent_less_than'),
  Type.Literal('sent_less_than_or_equal_to'),
]);

const PostConditionStxSchema = Type.Composite([
  PostConditionPrincipalSchema,
  Type.Object({
    condition_code: PostConditionFungibleConditionCodeSchema,
    amount: Type.String(),
    type: Type.Literal('stx'),
  }),
]);

const PostConditionFungibleSchema = Type.Composite([
  PostConditionPrincipalSchema,
  Type.Object({
    condition_code: PostConditionFungibleConditionCodeSchema,
    amount: Type.String(),
    type: Type.Literal('fungible'),
    asset: Type.Object({
      asset_name: Type.String(),
      contract_address: Type.String(),
      contract_name: Type.String(),
    }),
  }),
]);

const PostConditionNonFungibleSchema = Type.Composite([
  PostConditionPrincipalSchema,
  Type.Object({
    condition_code: Type.Union([Type.Literal('sent'), Type.Literal('not_sent')]),
    amount: Type.String(),
    type: Type.Literal('non_fungible'),
    asset_value: Type.Object({
      hex: Type.String(),
      repr: Type.String(),
    }),
    asset: Type.Object({
      asset_name: Type.String(),
      contract_address: Type.String(),
      contract_name: Type.String(),
    }),
  }),
]);

export const PostConditionSchema = Type.Union([
  PostConditionStxSchema,
  PostConditionFungibleSchema,
  PostConditionNonFungibleSchema,
]);
