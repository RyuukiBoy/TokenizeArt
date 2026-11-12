const fs = require("node:fs/promises");
const path = require("node:path");
const hre = require("hardhat");
const { PROJECT_ROOT, readDeployments } = require("./utils");

async function main() {
  const chainId = Number(BigInt(await hre.network.provider.send("eth_chainId")));
  if (chainId !== 97) throw new Error(`Minting is restricted to BSC Testnet (97); current chain is ${chainId}.`);
  const deployments = await readDeployments();
  const address = deployments.ipfs?.address;
  if (!address) throw new Error("No IPFS contract address found. Run npm run deploy:testnet first.");

  const ipfs = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, "mint/output/ipfs.json"), "utf8"));
  if (!ipfs.metadataUri || !ipfs.metadataUri.startsWith("ipfs://")) throw new Error("Upload metadata with npm run ipfs:upload first.");
  const [ownerWallet] = await hre.ethers.getSigners();
  const collection = await hre.ethers.getContractAt("TokenizeArt", address, ownerWallet);
  if ((await collection.owner()).toLowerCase() !== ownerWallet.address.toLowerCase()) {
    throw new Error("The first configured wallet is not the contract owner. Configure PRIVATE_KEY for the deployment wallet.");
  }
  const transaction = await collection.mintArt(ownerWallet.address, ipfs.metadataUri);
  const receipt = await transaction.wait();
  const event = receipt.logs.map((log) => {
    try { return collection.interface.parseLog(log); } catch { return null; }
  }).find((parsed) => parsed?.name === "ArtMinted");
  const tokenId = event.args.tokenId.toString();

  deployments.ipfs.tokenId = tokenId;
  deployments.ipfs.mintOwner = ownerWallet.address;
  deployments.ipfs.mintTransactionHash = receipt.hash;
  deployments.ipfs.mintedBlockNumber = receipt.blockNumber;
  deployments.ipfs.metadataUri = ipfs.metadataUri;
  deployments.ipfs.imageCid = ipfs.imageCid;
  await fs.writeFile(path.join(PROJECT_ROOT, "deployment/deployments/bscTestnet.json"), `${JSON.stringify(deployments, null, 2)}\n`);

  console.log(`Minted token ${tokenId} to ${ownerWallet.address}`);
  console.log(`Metadata: ${ipfs.metadataUri}`);
  console.log(`Transaction: ${receipt.hash}`);
  console.log(`BscScan: https://testnet.bscscan.com/tx/${receipt.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
