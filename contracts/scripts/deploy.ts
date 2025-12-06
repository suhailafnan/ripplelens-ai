import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = hre.ethers.provider;

  const deployer = new hre.ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  console.log("Deploying with:", deployer.address);

  // 1) Deploy MockFXRP
  const MockFXRP = await hre.ethers.getContractFactory("MockFXRP", deployer);
  const mockFxrp = await MockFXRP.deploy();
  await mockFxrp.waitForDeployment();
  const mockFxrpAddress = await mockFxrp.getAddress();
  console.log("MockFXRP deployed at:", mockFxrpAddress);

  // 2) Deploy ReputationOracle
  const ReputationOracle = await hre.ethers.getContractFactory("ReputationOracle", deployer);
  const rep = await ReputationOracle.deploy();
  await rep.waitForDeployment();
  const repAddress = await rep.getAddress();
  console.log("ReputationOracle deployed at:", repAddress);

  // 3) Deploy FxrpLendingPool
  const FxrpLendingPool = await hre.ethers.getContractFactory("FxrpLendingPool", deployer);
  const pool = await FxrpLendingPool.deploy(mockFxrpAddress, repAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("FxrpLendingPool deployed at:", poolAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
