import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";
import { LAUNCHPAD_TOKENS_MAINNET } from "../data/launchpadTokens";

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
    const initParams: any = {
      miningStartBlock: startBlock,
      miningEndBlock: endBlock,
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER
    };
    const newRound = 2

    const lauchpadFactory = await ethers.getContractAt("LaunchpadFactoryV2", "0x94B1B8bb81a80601f109D9bB3190C535f4F655ad");

    console.log(`Creating round ${newRound}..`);
    const createRoundTx = await lauchpadFactory.createRound(newRound, initParams)
      .then(async (res) => {
          const receipt = await res.wait();
          if(receipt?.status == 1) {
              console.log("tx succcess!");
          } else {
              console.log("tx failed!");
          }
          console.log("tx: ", res.hash);
      })
      .catch(error => {
          console.log(error);
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});