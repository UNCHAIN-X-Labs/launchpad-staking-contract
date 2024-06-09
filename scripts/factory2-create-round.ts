import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";
import { LAUNCHPAD_TOKENS_MAINNET } from "../data/launchpadTokens";

const minedBlockPerMin = 20;
const minedBlockPerHour = 1200;
const minedBlockPerDay = minedBlockPerHour * 24;
// Round Info
// Round 1: 38800552 ~ 39174951  2024-05-17 12:00 ~ 2024-05-30 12:00 UTC
// Round 2: 39177201 ~ 39465200 2024-05-30 02:40 ~ 2024-06-09 02:40 UTC
// Round 3: 39465595 ~ 39753594 2024-06-09 03:50 ~ 2024-06-19 03:50 UTC

const startBlock = 39462202 + (minedBlockPerHour * 4);
const endBlock = startBlock + (minedBlockPerDay * 10) - 1;

async function main() {
    const initParams: any = {
      miningStartBlock: startBlock,
      miningEndBlock: endBlock,
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER
    };
    const newRound = 3;

    const lauchpadFactory = await ethers.getContractAt("LaunchpadFactoryV2", "0x94B1B8bb81a80601f109D9bB3190C535f4F655ad");

    // console.log(`Creating round ${newRound}..`);
    // const createRoundTx = await lauchpadFactory.createRound(newRound, initParams)
    //   .then(async (res) => {
    //       const receipt = await res.wait();
    //       if(receipt?.status == 1) {
    //           console.log("tx succcess!");
    //       } else {
    //           console.log("tx failed!");
    //       }
    //       console.log("tx: ", res.hash);
    //   })
    //   .catch(error => {
    //       console.log(error);
    //       throw error;
    //   });

    // Pass to next round.
    // const passRoundTx = await lauchpadFactory.passToNextRound()
    //   .then(async (res) => {
    //       console.log('pass to next round...');

    //       const receipt = await res.wait();
    //       if(receipt?.status == 1) {
    //           console.log("tx succcess!");
    //           console.log(`current round: ${await lauchpadFactory.currentRound()}`);
    //       } else {
    //           console.log("tx failed!");
    //       }
    //       console.log("tx: ", res.hash);
    //   })
    //   .catch(error => {
    //     console.log(error);
    //     throw error;
    //   });
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