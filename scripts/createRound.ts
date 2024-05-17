import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { LAUNCHPAD_TOKENS_MAINNET } from "../data/launchpadTokens";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";

const minedBlockPerMin = 20;
const minedBlockPerHour = 1200;
const minedBlockPerDay = minedBlockPerHour * 24;
//  -> 2024-05-17 11:00 UTC
// Round Info
// Round 1:  + minedBlockPerHour  2024-05-17 12:00 ~ 2024-05-30 12:00 UTC
// Round 2: 
// Round 3: 
// Round 4: 
// Round 5: 
const startBlock = 40400250 + minedBlockPerHour + (minedBlockPerMin * 20);
const endBlock = startBlock + (minedBlockPerMin * 10) - 1;

async function main() {
  const lfCA = "0x15287Da8070DDA70D47E63260Fb8A6aE3dAE98ae";
  const lauchpadFactory = await ethers.getContractAt("LaunchpadFactory", lfCA);

    const roundNum = await lauchpadFactory.currentRound() + BigInt(1);
    const initParams: any = {
      miningStartBlock: startBlock,
      miningEndBlock: endBlock,
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER
    };
    const createRoundTx = await lauchpadFactory.createRound(roundNum, initParams);
    await createRoundTx.wait();

    console.log(`Lauchpad Staking: ${await lauchpadFactory.stakingContract(roundNum)}`);

    const passRoundTx = await lauchpadFactory.passToNextRound();
    await passRoundTx.wait();

    console.log(`current round: ${await lauchpadFactory.currentRound()}`)
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