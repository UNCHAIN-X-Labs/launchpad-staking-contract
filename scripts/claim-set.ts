import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";
import { LAUNCHPAD_TOKENS_MAINNET } from "../data/launchpadTokens";

async function main() {
    const params = {
      countLimit: 10,
      startTimestamp: 1723680000,  // 2024-08-15 00:00:00 UTC
      cycle: 2592000               // 30 Days
    }
    const rewardClaim = await ethers.getContractAt("RewardClaim", "");

    console.log(`Setting claim schedule..`);
    const setTx = await rewardClaim.setClaimSchedule(params)
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});