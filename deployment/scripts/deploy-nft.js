const fs = require("node:fs/promises");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  const chainId = Number(await hre.network.provider.send("eth_chainId").then((id) => BigInt(id)));
  if (hre.network.name === "bscTestnet" && chainId !== 97) {
    throw new Error(`Refusing to deploy: expected BSC Testnet chain 97, got ${chainId}`);
  }
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer wallet is configured. Set PRIVATE_KEY in deployment/.env.");

  const factory = await hre.ethers.getContractFactory("TokenizeArt", deployer);
  const collection = await factory.deploy();
  await collection.waitForDeployment();
  const receipt = await collection.deploymentTransaction().wait();
  const address = await collection.getAddress();
  const projectRoot = path.resolve(__dirname, "../..");

  const record = {
    network: hre.network.name === "bscTestnet" ? "BNB Smart Chain Testnet" : hre.network.name,
    chainId,
    ipfs: {
      address,
      owner: deployer.address,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      deployedAt: new Date().toISOString()
    },
    onChain: null
  };
  const fileName = hre.network.name === "bscTestnet" ? "bscTestnet.json" : `${hre.network.name}.json`;
  const recordPath = path.join(projectRoot, "deployment/deployments", fileName);
  await fs.mkdir(path.dirname(recordPath), { recursive: true });
  await fs.writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  console.log(`Network: ${record.network} (chain ${chainId})`);
  console.log(`TokenizeArt address: ${address}`);
  console.log(`Owner: ${deployer.address}`);
  console.log(`Transaction: ${receipt.hash}`);
  console.log(`Deployment record: ${path.relative(projectRoot, recordPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
