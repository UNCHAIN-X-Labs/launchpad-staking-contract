import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { LAUNCHPAD_TOKENS_TEST } from "../data/launchpadTokens";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";

async function main() {
    const rewardToken = "";
    const collector = "";
    const initParams: any = {
      miningStartBlock: 0,
      miningEndBlock: 0,
      bonusSupply: 0,
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER,
      claimSchedule: {
        countLimit: 0,
        startBlock: 0,
        cycle: 0
      }
    };

    const contractFactory = await ethers.getContractFactory("LaunchpadStaking");
    const stakingTokenContract = await contractFactory.deploy(rewardToken, collector);
    const result = await stakingTokenContract.waitForDeployment();
    const ca = await result.getAddress();
    console.log("Launchpad deploy success:", );

    const launchpad = await ethers.getContractAt("LaunchpadStaking", ca);
    const initialization = await launchpad.initialize(initParams);
    const tx = await initialization.wait();
    console.log(`Launchpad initialize success: ${tx}`);
}

function getPools(): any[] {
  return LAUNCHPAD_TOKENS_TEST.map((token) => {
    return {
      stakingToken: token.address,
      allocation: getAllocationPerBlock(37500)
    }
  });;
}

function getAllocationPerBlock(allocation: number): bigint {
  const minedBlockPerHour = 1200;
  return BigInt(parseEther(allocation.toString()) / BigInt(minedBlockPerHour * 24 * 30));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
