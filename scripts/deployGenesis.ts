import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";
import { LAUNCHPAD_TOKENS_MAINNET } from "../data/launchpadTokens";

const minedBlockPerMin = 20;
const minedBlockPerHour = 1200;
const minedBlockPerDay = minedBlockPerHour * 24;
//  -> 2024-05-17 20:00 UTC+9
// Round Info
// Round 1:  + minedBlockPerHour  2024-05-17 21:00 ~ 2024-05-30 21:00 UTC+9
const startBlock = 0 + minedBlockPerHour;
const endBlock = startBlock + (minedBlockPerDay * 13) - 1;

async function main() {
    const collector = "0x70c3c20419153768c1F920eC5333d087971E3F55";
    const totalNum = 5;
    const initParams: any = {
      miningStartBlock: startBlock,
      miningEndBlock: endBlock,
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER
    };
    
    const GenesisX = await ethers.getContractFactory("GenesisX");
    const genesisX = await GenesisX.deploy(
        collector,
        collector,
        parseEther("10000000000"),
        parseEther("331515000"),
        parseEther("118485000"),
        totalNum
    );

    const receipt = await genesisX.waitForDeployment();
    const genesisXCA = await receipt.getAddress();
    const launchpadFactoryCA = await genesisX.launchpadFactory();
    const lauchpadFactory = await ethers.getContractAt("LaunchpadFactory", launchpadFactoryCA);
    const createRoundTx = await lauchpadFactory.createRound(1, initParams);
    await createRoundTx.wait();

    console.log(`Genesis-X: ${genesisXCA}`);
    console.log(`Lauchpad Factory: ${launchpadFactoryCA}`);
    console.log(`Lauchpad Staking: ${await lauchpadFactory.stakingContract(1)}`)
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