import { Horizon, Networks, SorobanRpc } from '@stellar/stellar-sdk';

const isTestnet = process.env.STELLAR_NETWORK === 'testnet';

export const horizonServer = new Horizon.Server(
  isTestnet
    ? 'https://horizon-testnet.stellar.org'
    : 'https://horizon.stellar.org',
  { allowHttp: false }
);

export const sorobanRpc = new SorobanRpc.Server(
  isTestnet
    ? 'https://soroban-testnet.stellar.org'
    : 'https://soroban.stellar.org',
  { allowHttp: false }
);

export const networkPassphrase = isTestnet
  ? Networks.TESTNET
  : Networks.PUBLIC;
