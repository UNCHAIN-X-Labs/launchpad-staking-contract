import { ethers } from "hardhat";
import { REFUND_USERS as users1 } from "../data/onchain/refundUsers-1";
import { REFUND_USERS as users2 } from "../data/onchain/refundUsers-2";
import { REFUND_USERS as users3 } from "../data/onchain/refundUsers-3";
import { REFUND_USERS as users4 } from "../data/onchain/refundUsers-4";

const BNB = "0x0000000000000000000000000000000000000000";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const DOGE = "0xbA2aE424d960c26247Dd6c32edC70B295c744C43";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const FDUSD = "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409";
const ETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
const SOL = "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF";
const XRP = "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE";

const tokens = [BNB, USDT, DOGE, BTCB, FDUSD, ETH, SOL, XRP];

const round1 = '0x8d2F485bfFc182278c7Ca49f1629d5d5420aE245';
const round2 = '0xd7D98C9Cf0A3B0b09E5B2848b9250101f21A1240';
const round3 = '0x057d5BF977cE40A7c1c63b1B58609120350fa015';
const round4 = '0xF28961b972163Fad8F220a9df86014e74DF911E8';
const round5 = '0x0eA8F9B3EFF635C7e5791BfF899055e4f3Ce0550';

const rounds = [round1, round2, round3, round4, round5];
const users = [users1, users2, users3, users4, []];


async function main() {
  let i = 0;
  let totalRewards: bigint = BigInt(0);

  for await (const round of rounds) {
    const lauchpadStaking = await ethers.getContractAt("LaunchpadStakingV2", round);
    const roundNum = await lauchpadStaking.round();

    for await (const user of users[i]) {
      for await (const token of tokens) {
        console.log(`Total Earned for round ${roundNum}..`);
        const reward = await lauchpadStaking.earnedForAllOptions(user, token);
        console.log(await formatUnits(reward, 18));
        totalRewards += reward;
      }
    }
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