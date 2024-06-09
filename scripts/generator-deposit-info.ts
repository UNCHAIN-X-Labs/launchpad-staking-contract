import { formatEther } from "ethers";
import { ethers } from "hardhat";
import { REFUND_USERS } from "../data/onchain/refundUsers-1";
import * as fs from 'fs';

const BNB = "0x0000000000000000000000000000000000000000";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const DOGE = "0xbA2aE424d960c26247Dd6c32edC70B295c744C43";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const FDUSD = "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409";
const ETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
const SOL = "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF";
const XRP = "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE";

const tokens = [BNB, USDT, DOGE, BTCB, FDUSD, ETH, SOL, XRP];

interface DepositDetail {
    token: string;
    amount: string;
    rewards: string;
    dailyRewards: string;
    refundOption: string;
}

interface DepositInfo {
    account: string;
    details: DepositDetail[];
}

async function main() {
    const depositInfos: DepositInfo[] = [];
    const users: string[] = REFUND_USERS;
    const lauchpadStaking = await ethers.getContractAt("LaunchpadStakingV2", "0x8d2F485bfFc182278c7Ca49f1629d5d5420aE245");

    let i = 0;
    for await (const user of users) {
      console.log(`\nProcessing.. (${i+1}/${users.length})`);
      const depositInfo: DepositInfo = {
          account: user,
          details: []
      };

      let j = 0;
      for await (const token of tokens) {
        const deposits = await lauchpadStaking.depositInfoListByToken(user, token);
        if(deposits.length > 0) {
            const detail = await Promise.all(deposits.map(async (data) => {
                return {
                    token: data[0],
                    amount: data[1].toString(),
                    rewards: data[2].toString(),
                    dailyRewards: data[3].toString(),
                    refundOption: data[4].toString()
                }
            }));
            depositInfo.details.push(...detail);
        }
        j++;
      }

      depositInfos.push(depositInfo);
      console.log(depositInfo);
      i++;
    }

    console.log(depositInfos.length);

    // Convert the depositInfos array to JSON and save it to a file
    const jsonContent = JSON.stringify(depositInfos, null, 2);

    fs.writeFile("data/onchain/depositInfos.json", jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occurred while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });

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