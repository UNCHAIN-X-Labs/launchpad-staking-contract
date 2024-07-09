import hre, { ethers } from "hardhat";

async function main() {
    const unx = "0x4F0572cA0BF96F5ae17B7062D97ceA3f35BDeA6f";
    const factory = "0x94B1B8bb81a80601f109D9bB3190C535f4F655ad";
    
    const Faucet = await ethers.getContractFactory('UNXFaucet');
    const faucet = await Faucet.deploy(unx, factory);
    console.log("deploying...")

    const deployement = await faucet.waitForDeployment();
    const faucetCA = await deployement.getAddress();
    console.log("deploy success!");
    console.log("faucet: ", faucetCA);

    await hre.run("verify:verify", {
      address: faucetCA,
      constructorArguments: [
        unx,
        factory
      ]
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});