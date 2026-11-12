const fs = require("node:fs/promises");
const path = require("node:path");
const hre = require("hardhat");
const { readDeployments, writeDeployments, writeJson, PROJECT_ROOT } = require("./mint/utils");

async function main() {
  const chainId = Number(BigInt(await hre.network.provider.send("eth_chainId")));
  if (hre.network.name === "bscTestnet" && chainId !== 97) {
    throw new Error(`Refusing to deploy: expected BSC Testnet chain 97, got ${chainId}`);
  }
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("No deployer wallet is configured. Set PRIVATE_KEY in deployment/.env.");

  const constructorArguments = ["TokenizeArt 42 On-Chain", "TA42C", "oait-bad"];
  const factory = await hre.ethers.getContractFactory("TokenizeArtOnChain", deployer);
  const collection = await factory.deploy(...constructorArguments);
  await collection.waitForDeployment();
  const receipt = await collection.deploymentTransaction().wait();
  const address = await collection.getAddress();

  const isTestnet = hre.network.name === "bscTestnet";
  const recordPath = path.join(
    PROJECT_ROOT,
    "deployment/deployments",
    isTestnet ? "bscTestnet.json" : `${hre.network.name}.json`
  );
  let record;
  if (isTestnet) {
    record = await readDeployments();
  } else {
    try { record = JSON.parse(await fs.readFile(recordPath, "utf8")); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      record = { network: hre.network.name, chainId, ipfs: null, onChain: null };
    }
  }
  record.network = hre.network.name === "bscTestnet" ? "BNB Smart Chain Testnet" : hre.network.name;
  record.chainId = chainId;
  record.onChain = {
    address,
    owner: deployer.address,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    deployedAt: new Date().toISOString()
  };
  if (isTestnet) await writeDeployments(record);
  else await fs.writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  if (isTestnet) {
    const artifact = await hre.artifacts.readArtifact("TokenizeArtOnChain");
    await writeJson(path.join(PROJECT_ROOT, "mint/website/src/deployment.json"), {
      address,
      chainId,
      abi: artifact.abi
    });
  }

  console.log(`Network: ${record.network} (chain ${chainId})`);
  console.log(`TokenizeArtOnChain address: ${address}`);
  console.log(`Owner: ${deployer.address}`);
  console.log(`Transaction: ${receipt.hash}`);
  if (isTestnet) console.log(`Website deployment config written to mint/website/src/deployment.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
