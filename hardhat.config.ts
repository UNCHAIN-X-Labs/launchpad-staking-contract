import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-docgen';

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
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
    }
  },
  docgen: {
    outputDir: './docs',
    pages: 'files'
  }
};

export default config;
