import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { LAUNCHPAD_TOKENS_TEST } from "../data/launchpadTokens";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";

const minedBlockPerHour = 1200;
const minedBlockPerDay = minedBlockPerHour * 24;
// 40202371 -> 2024-05-10 15:00 UTC+9
const startBlock = 40202371 + (minedBlockPerHour * 2);
const endBlock = startBlock + minedBlockPerDay * 4 - 1;

async function main() {
    const rewardToken = "";
    const collector = "";
    const initParams: any = {
      miningStartBlock: startBlock,
      miningEndBlock: endBlock,
      bonusSupply: parseEther("297750000"),
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER,
      claimSchedule: {
        countLimit: 10,
        startBlock: endBlock + 1,
        cycle: minedBlockPerHour * 3
      }
    };

    const contractFactory = await ethers.getContractFactory("LaunchpadStaking");
    const stakingTokenContract = await contractFactory.deploy(rewardToken, collector);
    const result = await stakingTokenContract.waitForDeployment();
    const ca = await result.getAddress();
    console.log("Launchpad deploy success:", ca);

    const rToken = await ethers.getContractAt('ERC20', rewardToken);
    const transferTx = await rToken.transfer(ca, parseEther('330000000'));
    const txReceipt1 = await transferTx.wait();
    console.log(`reward token transfer to Launchpad success: ${txReceipt1}`);

    const launchpad = await ethers.getContractAt("LaunchpadStaking", ca);
    const initializationTx = await launchpad.initialize(initParams);
    const txReceipt2 = await initializationTx.wait();
    console.log(`Launchpad initialize success: ${txReceipt2}`);
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
  return BigInt(parseEther(allocation.toString()) / BigInt(minedBlockPerHour * 24 * 50));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
