import { ethers } from "hardhat";
import { LAUNCHPAD_TOKENS_TEST } from "../data/launchpadTokens";
import { parseUnits } from "ethers";

async function main() {
    const receiver = "" // Account for reserve initial minting token.
    const contractFactory = await ethers.getContractFactory("SampleERC20");
    
    for(let i = 0; i < LAUNCHPAD_TOKENS_TEST.length; i++) {
      if(LAUNCHPAD_TOKENS_TEST[i].address != "0x0000000000000000000000000000000000000000") {
        const contract = await contractFactory.deploy(
          LAUNCHPAD_TOKENS_TEST[i].name,
          LAUNCHPAD_TOKENS_TEST[i].symbol,
          parseUnits("1000000", LAUNCHPAD_TOKENS_TEST[i].decimals),
          LAUNCHPAD_TOKENS_TEST[i].decimals,
          receiver
        );
        const result = await contract.waitForDeployment();
        const ca = await result.getAddress();
        console.log(`${LAUNCHPAD_TOKENS_TEST[i].symbol} deploy success: ${ca}`);
      }
    }

    const contract = await contractFactory.deploy(
      "TEST REWARD TOKEN",
      "TRT",
      parseUnits("1000000", 18),
      18,
      receiver
    );
    const result = await contract.waitForDeployment();
    const ca = await result.getAddress();
    console.log(`TEST REWARD TOKEN deploy success: ${ca}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
