import { network } from "hardhat";

async function main() {
  // Connect to the ganache network configured in hardhat.config.ts
  const { ethers } = await network.create({
    network: "ganache",
  });

  const [deployer] = await ethers.getSigners();
  console.log("Deploying CertificateRegistry with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const certificateRegistry = await ethers.deployContract("CertificateRegistry");
  await certificateRegistry.waitForDeployment();

  const address = await certificateRegistry.getAddress();
  console.log("\n==================================================");
  console.log("CertificateRegistry Deployed Successfully!");
  console.log("Contract Address:", address);
  console.log("==================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
