import { ethers } from "hardhat";

async function main() {
    const deployer = "0xFB4401d376e1e85dcA4e93E4DF79464aca0A85A6";
    const unx = "0x4F0572cA0BF96F5ae17B7062D97ceA3f35BDeA6f";
    const collector = "0x70c3c20419153768c1F920eC5333d087971E3F55";
    const round1 = "0x8d2F485bfFc182278c7Ca49f1629d5d5420aE245";
    const totalNum = 5;

    const Factory2 = await ethers.getContractFactory("LaunchpadFactoryV2");
    const factory2 = await Factory2.deploy(deployer, unx, collector, totalNum);
    console.log("deploying...")

    const deployement = await factory2.waitForDeployment();
    console.log("deploy success!");
    console.log("factroy2: ", await deployement.getAddress());

    const tx = await deployement.setRound(1, round1)
      .then(async(res) => {
          console.log("submit transaction...")
          const receipt = await res.wait();

          if(receipt?.status == 1) {
              console.log("tx succcess!");
          } else {
              console.log("tx failed!");
          }
          console.log("tx: ", res.hash);
      })
      .catch((error) => {
          console.log(error);
      });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});