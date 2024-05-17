import { parseEther } from "ethers";
import { ethers } from "hardhat";
import { MINING_MULTIPLIER } from "../data/miningMultiplier";
import { LAUNCHPAD_TOKENS_MAINNET } from "../data/launchpadTokens";

const minedBlockPerMin = 20;
const minedBlockPerHour = 1200;
const minedBlockPerDay = minedBlockPerHour * 24;
// 38799352 -> 2024-05-17 11:00 UTC
// Round Info
// Round 1: 38799352 + minedBlockPerHour  2024-05-17 12:00 ~ 2024-05-30 12:00 UTC
const startBlock = 38799352 + minedBlockPerHour;
const endBlock = startBlock + (minedBlockPerDay * 13) - 1;

async function main() {
    const ecosystemReserve = "0x6a924a143476753395BdE8a0565baCccDF90Abcf";
    const collector = "0x70c3c20419153768c1F920eC5333d087971E3F55";
    const totalSupply = parseEther("10000000000");
    const launchpadSupply = parseEther("331515000");
    const ecosystemSupply = parseEther("118485000");
    const totalNum = 5;
    const initParams: any = {
      miningStartBlock: startBlock,
      miningEndBlock: endBlock,
      poolList: getPools(),
      miningMultipliers: MINING_MULTIPLIER
    };

    console.log("startBlock: ", startBlock);
    console.log("endBlock: ", endBlock);
    
    const GenesisX = await ethers.getContractFactory("GenesisX");
    const genesisX = await GenesisX.deploy(
        ecosystemReserve,
        collector,
        totalSupply,
        launchpadSupply,
        ecosystemSupply,
        totalNum
    );
    console.log('Gensis-X deploying..');
    const receipt = await genesisX.waitForDeployment();
    console.log('Success..!');
    const genesisXCA = await receipt.getAddress();
    const launchpadFactoryCA = await genesisX.launchpadFactory();
    const lauchpadFactory = await ethers.getContractAt("LaunchpadFactory", launchpadFactoryCA);
    const unxCA = await lauchpadFactory.rewardToken();

    console.log('Creating round 1..');
    const createRoundTx = await lauchpadFactory.createRound(1, initParams);
    await createRoundTx.wait();
    console.log('Success..!')

    console.log(`Genesis-X: ${genesisXCA}`);
    console.log(`UNX: ${unxCA}`)
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