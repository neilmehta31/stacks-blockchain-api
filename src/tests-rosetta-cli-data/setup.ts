import { defaultSetupInit } from '../test-utils/shared-setup';

// ts-unused-exports:disable-next-line
export default async (): Promise<void> => {
  console.log('Jest - setup..');
  await defaultSetupInit({ dummyEventHandler: true });
  console.log('Jest - setup done');
};
