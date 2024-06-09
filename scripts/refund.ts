import { formatEther } from "ethers";
import { REFUND_USERS } from "../data/onchain/refundUsers-2";
import { ethers } from "hardhat";

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
    const batches: string[][] = [];
    for (let i = 0; i < users.length; i += batchNum) {
        batches.push(users.slice(i, i + batchNum));
    }

    const lauchpadStaking = await ethers.getContractAt("LaunchpadStakingV2", "0xd7D98C9Cf0A3B0b09E5B2848b9250101f21A1240");
    const round = await lauchpadStaking.round();
    let txCount = 0;

    console.log(`Transfer refund round ${round}..`);

    // batch
    for await (const batch of batches) {
        console.log(`Trying transfer to ${batch[0]} ~ ${batch[batch.length - 1]} ..`);
        delay(2000);
        const tx = await lauchpadStaking.withdrawRefundBatch(batch)
        .then(async (res) => {
            const receipt = await res.wait();
            if(receipt?.status == 1) {
                console.log("tx succcess!");
            } else {
                console.log("tx failed!");
            }
            console.log("tx: ", res.hash);
        });
        txCount++;
    }

   console.log(`\ntotal tx count: ${txCount}`);
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