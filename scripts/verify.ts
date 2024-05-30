import { parseEther } from 'ethers';
import hre, { ethers } from 'hardhat';
import { MINING_MULTIPLIER } from '../data/miningMultiplier';
import { LAUNCHPAD_TOKENS_MAINNET } from '../data/launchpadTokens';

const minedBlockPerMin = 20;
const minedBlockPerHour = 1200;
const minedBlockPerDay = minedBlockPerHour * 24;
// 38799352 -> 2024-05-17 11:00 UTC
// 39166834 -> 2024-05-30 06:00 UTC
// Round Info
// Round 1: 38799352 + minedBlockPerHour  2024-05-17 12:00 ~ 2024-05-30 12:00 UTC
// Round 2: 39166834 + (minedBlockPerHour * 8)  2024-05-30 13:00 ~ 2024-06-09 13:00 UTC

const startBlock = 39166834 + (minedBlockPerHour * 8);
const endBlock = startBlock + (minedBlockPerDay * 10) - 1;

async function main() {
    const ecosystemReserve = "0x6a924a143476753395BdE8a0565baCccDF90Abcf";
    const collector = "0x70c3c20419153768c1F920eC5333d087971E3F55";
    const totalSupply = parseEther("10000000000");
    const launchpadSupply = parseEther("331515000");
    const ecosystemSupply = parseEther("118485000");
    const deployer = "0xFB4401d376e1e85dcA4e93E4DF79464aca0A85A6";
    const unx = "0x4F0572cA0BF96F5ae17B7062D97ceA3f35BDeA6f";
    const totalNum = 5;
    const initParams: any = {
      miningStartBlock: startBlock,
      miningEndBlock: endBlock,
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER
    };

    await hre.run("verify:verify", {
        address: "0xd7D98C9Cf0A3B0b09E5B2848b9250101f21A1240",
        constructorArguments: [
          collector,  // collector
          2           // round number
        ]
    });
}

function getPools(): any[] {
    return LAUNCHPAD_TOKENS_MAINNET.map((token) => {
      return {
        stakingToken: token.address,
        allocation: getAllocationPerBlock(37500)
      }
    });
  }
  
  function getAllocationPerBlock(allocation: number): bigint {
    return BigInt(parseEther(allocation.toString()) / BigInt(minedBlockPerHour * 24));
  }

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});