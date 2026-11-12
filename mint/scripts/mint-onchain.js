const fs = require("node:fs/promises");
const path = require("node:path");
const hre = require("hardhat");
const { PROJECT_ROOT, readDeployments } = require("./utils");

async function main() {
  const chainId = Number(BigInt(await hre.network.provider.send("eth_chainId")));
  if (chainId !== 97) throw new Error(`Minting is restricted to BSC Testnet (97); current chain is ${chainId}.`);
  const deployments = await readDeployments();
  const address = deployments.onChain?.address;
  if (!address) throw new Error("No on-chain contract address found. Run npm run onchain:deploy:testnet first.");
  const [ownerWallet] = await hre.ethers.getSigners();
  const collection = await hre.ethers.getContractAt("TokenizeArtOnChain", address, ownerWallet);
  if ((await collection.owner()).toLowerCase() !== ownerWallet.address.toLowerCase()) {
    throw new Error("Wallet 1 is not the on-chain contract owner; ownerMint requires the deployer wallet.");
  }
  const transaction = await collection.ownerMint(ownerWallet.address);
  const receipt = await transaction.wait();
  const event = receipt.logs.map((log) => {
    try { return collection.interface.parseLog(log); } catch { return null; }
  }).find((parsed) => parsed?.name === "ArtMinted");
  const tokenId = event.args.tokenId.toString();

  deployments.onChain.tokenId = tokenId;
  deployments.onChain.mintOwner = ownerWallet.address;
  deployments.onChain.mintTransactionHash = receipt.hash;
  deployments.onChain.mintedBlockNumber = receipt.blockNumber;
  await fs.writeFile(path.join(PROJECT_ROOT, "deployment/deployments/bscTestnet.json"), `${JSON.stringify(deployments, null, 2)}\n`);
  console.log(`Minted on-chain token ${tokenId} to ${ownerWallet.address}`);
  console.log(`Transaction: ${receipt.hash}`);
  console.log(`BscScan: https://testnet.bscscan.com/tx/${receipt.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
