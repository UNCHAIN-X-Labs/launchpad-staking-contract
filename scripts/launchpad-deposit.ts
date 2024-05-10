import { ZeroAddress, parseEther } from "ethers";
import { ethers } from "hardhat";

async function main() {
    const ca = "";
    const launchpad = await ethers.getContractAt("LaunchpadStaking", ca);
    const depositParams = {
      token: ZeroAddress,
      amount: parseEther("1"),
      refundOption: 99
    }
    const tx = await launchpad.deposit(depositParams)
      .then(async (data) => {
        const receipt = await data.wait();
        console.log(receipt);
      })
      .catch(error => {
        if(error.data && launchpad) {
          const decodedError = launchpad.interface.parseError(error.data);
          console.log(decodedError)
        } else {
          console.log("else: ", error)
        }
      });

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
