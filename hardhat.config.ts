import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-docgen';
import { SolcConfig } from "hardhat/types";
import * as dotenv from 'dotenv';

dotenv.config();

const CompilerSettings = {
  viaIR: true,
  optimizer: {
      enabled: true,
      details: {
        yulDetails: {
          optimizerSteps: "u"
        }
      },
      runs: 200,
  },
};

const CompilerVersions = ['0.8.24'];

const _compilers: SolcConfig[] = CompilerVersions.map((item) => {
  return {
      version: item,
      settings: CompilerSettings,
  };
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: _compilers,
  },
  networks: {
    bnb: {
      url: process.env.BNB_MAINNET_URL,
      // accounts: [process.env.PRIVATE_KEY || ''],
      chainId: 56,
    },
    bnbtest: {
      url: process.env.BNB_TESTNET_URL,
      accounts: [process.env.PRIVATE_KEY || ''],
      chainId: 97
    },
    arbitrum: {
      url: process.env.ARB_MAINNET_URL,
      // accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 42161
    },
  },
  mocha: {
      timeout: 10 * 60 * 1000
  },
  docgen: {
    outputDir: './docs',
    pages: 'files'
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    token: 'BNB',
    coinmarketcap: process.env.API_COINMARKETCAP,
    gasPriceApi: process.env.API_BNB_SCAN,
  },
  etherscan: {
    apiKey: {
      etherum: process.env.API_ETHER_SCAN || "",
      goerli: process.env.API_ETHER_SCAN || "",
      arbitrumOne: process.env.API_ARB_SCAN || ""
    }
  }
};

export default config;
