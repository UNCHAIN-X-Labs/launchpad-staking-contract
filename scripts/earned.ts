import { formatEther } from "ethers";
import { ethers } from "hardhat";
import { REFUND_USERS } from "../data/refundUsers";

async function main() {
    const users: string[] = REFUND_USERS;
    const lauchpadStaking = await ethers.getContractAt("LaunchpadStakingV2", "0x8d2F485bfFc182278c7Ca49f1629d5d5420aE245");
    const round = await lauchpadStaking.round();
    let totalRewards: bigint = BigInt(0);

    console.log(`Total Earned for round ${round}..`);
    let i = 0;
    for await (const user of users) {
      console.log(`\nProcessing.. (${i+1}/${users.length})`);
      const reward = await lauchpadStaking.totalUserRewards(user);
      totalRewards += reward;
      console.log(`User(${user}): ${reward}`);
      i++;
    }

    console.log(`total Rewards: ${await formatUnits(totalRewards, 18)}`);
}

async function formatUnits(amount: bigint, decimals: number): Promise<string> {
  return ethers.formatUnits(amount, decimals);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});