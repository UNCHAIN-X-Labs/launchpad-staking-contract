import { formatEther } from "ethers";
import { ethers } from "hardhat";
import { REFUND_USERS } from "../data/refundUsers";

const BNB = "0x0000000000000000000000000000000000000000";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const DOGE = "0xbA2aE424d960c26247Dd6c32edC70B295c744C43";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const FDUSD = "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409";
const ETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
const SOL = "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF";
const XRP = "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE";

let totalBNB: bigint = BigInt(0);
let totalUSDT: bigint = BigInt(0);
let totalDOGE: bigint = BigInt(0);
let totalBTCB: bigint = BigInt(0);
let totalFDUSD: bigint = BigInt(0);
let totalETH: bigint = BigInt(0);
let totalSOL: bigint = BigInt(0);
let totalXRP: bigint = BigInt(0);

async function main() {
    const batchNum = 50;
    const users: string[] = REFUND_USERS;
    const lauchpadStaking = await ethers.getContractAt("LaunchpadStakingV2", "0x8d2F485bfFc182278c7Ca49f1629d5d5420aE245");
    const round = await lauchpadStaking.round();

    console.log(`Transfer refund round ${round}..`);

    // single
    let i = 0;
    let txCount = 0;
    for await (const user of users) {
      console.log(`\nProcessing.. (${i+1}/${users.length})`);
      const tokens = await lauchpadStaking.depositedPoolsByAccount(user);
      console.log(`User: ${user}`);

      let j = 0;
      for await (const token of tokens) {
          console.log(`Trying transfer token(${token}).. ${j+1}/${tokens.length}`);
          const refund = await lauchpadStaking.refundOf(user, token);

          if(refund > 0) {
             console.log(`refund: ${refund}.`);
             mappingToken(token, refund);
            // const createRoundTx = await lauchpadStaking.withdrawRefund(user, token)
            // .then(async (res) => {
            //     const receipt = await res.wait();
            //     if(receipt?.status == 1) {
            //         console.log("tx success!");
            //     } else {
            //         console.log("tx: ", res.hash);
            //         throw Error("tx failed!");
            //     }
            // })
             txCount++;
          } else {
             console.log(`refund is ${refund}.`);
          }
          j++;
      }
      i++;
  }

    // batch
    // for (let i = 0; i < users.length; i += batchNum) {
    //     const input = users.slice(i, i + batchNum);
    //     console.log(`Trying transfer to ${input[0]} ~ ${input[input.length - 1]} ..`);

    //     const createRoundTx = await lauchpadStaking.withdrawRefundBatch(input)
    //     .then(async (res) => {
    //         const receipt = await res.wait();
    //         if(receipt?.status == 1) {
    //             console.log("tx succcess!");
    //         } else {
    //             console.log("tx failed!");
    //         }
    //         console.log("tx: ", res.hash);
    //     })
    // }

   console.log(`\ntotal tx count: ${txCount}`);
   console.log(`total BNB: ${await formatUnits(totalBNB, 18)}`);
   console.log(`total USDT: ${await formatUnits(totalUSDT, 18)}`);
   console.log(`total DOGE: ${await formatUnits(totalDOGE, 8)}`);
   console.log(`total BTCB: ${await formatUnits(totalBTCB, 18)}`);
   console.log(`total FDUSD: ${await formatUnits(totalFDUSD, 18)}`);
   console.log(`total ETH: ${await formatUnits(totalETH, 18)}`);
   console.log(`total SOL: ${await formatUnits(totalSOL, 18)}`);
   console.log(`total XRP: ${await formatUnits(totalXRP, 18)}`);
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function formatUnits(amount: bigint, decimals: number): Promise<string> {
  return ethers.formatUnits(amount, decimals);
}

async function mappingToken(token: string, amount: bigint): Promise<void> {
    switch (token) {
      case BNB:
        totalBNB += amount; 
        break;
      case USDT:
        totalUSDT += amount; 
        break;
      case DOGE:
        totalDOGE += amount; 
        break;
      case BTCB:
        totalBTCB += amount; 
        break;
      case FDUSD:
        totalFDUSD += amount; 
        break;
      case ETH:
        totalETH += amount; 
        break;
      case SOL:
        totalSOL += amount; 
        break;
      case XRP:
        totalXRP += amount; 
        break;
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});