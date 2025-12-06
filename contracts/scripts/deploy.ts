import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  // Use the provider and signer configured by Hardhat
  const provider = new ethers.JsonRpcProvider(
    (hre.network.config as any).url
  );
  const privateKey = process.env.PRIVATE_KEY as string;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not set in .env");
  }
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deploying with:", await wallet.getAddress());

  // 1) Deploy MockFXRP
  const MockFXRP = await hre.ethers.getContractFactory("MockFXRP", wallet as any);
  const mockFxrp = await MockFXRP.deploy();
  await mockFxrp.waitForDeployment();
  const mockFxrpAddress = await mockFxrp.getAddress();
  console.log("MockFXRP deployed at:", mockFxrpAddress);

  // 2) Deploy ReputationOracle
  const ReputationOracle = await hre.ethers.getContractFactory("ReputationOracle", wallet as any);
  const rep = await ReputationOracle.deploy();
  await rep.waitForDeployment();
  const repAddress = await rep.getAddress();
  console.log("ReputationOracle deployed at:", repAddress);

  // 3) Deploy FxrpLendingPool
  const FxrpLendingPool = await hre.ethers.getContractFactory("FxrpLendingPool", wallet as any);
  const pool = await FxrpLendingPool.deploy(
    mockFxrpAddress,
    repAddress
  );
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("FxrpLendingPool deployed at:", poolAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
