import { ethers } from "hardhat";

async function main() {
    const unx = "0x4F0572cA0BF96F5ae17B7062D97ceA3f35BDeA6f";
    const factory2 = "0xb55590eEd0D4b01E374009F5003Cab63721B9c8F";
    const RewardClaim = await ethers.getContractFactory("RewardClaim");
    const rewardClaim = await RewardClaim.deploy(unx, factory2);
    console.log("deploying...")

    const deployement = await rewardClaim.waitForDeployment();
    console.log("deploy success!");
    console.log("rewardClaim: ", await deployement.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});