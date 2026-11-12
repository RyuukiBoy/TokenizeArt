const fs = require("node:fs/promises");
const path = require("node:path");
const hre = require("hardhat");
const { PROJECT_ROOT, getGatewayBase, ipfsGatewayUrl, ipfsUriToGatewayUrl, readDeployments } = require("./utils");

async function fetchFromGateways(cid, accept = "*/*") {
  const gateways = [getGatewayBase(), "https://gateway.pinata.cloud", "https://ipfs.io"];
  let lastError;
  for (const gateway of [...new Set(gateways)]) {
    const url = ipfsGatewayUrl(cid, gateway);
    try {
      const response = await fetch(url, { headers: { Accept: accept }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return { response, url };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Could not fetch ${cid} through the configured gateways: ${lastError?.message}`);
}

async function main() {
  const chainId = Number(BigInt(await hre.network.provider.send("eth_chainId")));
  if (chainId !== 97) throw new Error(`Display is configured for BSC Testnet (97); current chain is ${chainId}.`);
  const deployments = await readDeployments();
  const address = deployments.ipfs?.address;
  if (!address) throw new Error("No IPFS contract address found. Run npm run deploy:testnet first.");
  const tokenId = process.env.TOKEN_ID || deployments.ipfs.tokenId || "1";
  const provider = hre.ethers.provider;
  const collection = await hre.ethers.getContractAt("TokenizeArt", address, provider);
  const owner = await collection.ownerOf(tokenId);
  const tokenUri = await collection.tokenURI(tokenId);
  if (!tokenUri.startsWith("ipfs://")) throw new Error(`Unexpected tokenURI: ${tokenUri}`);

  const metadataCid = tokenUri.slice("ipfs://".length);
  const { response: metadataResponse, url: metadataUrl } = await fetchFromGateways(metadataCid, "application/json");
  const metadata = await metadataResponse.json();
  if (metadata.artist !== "oait-bad" || !metadata.name.includes("42")) {
    throw new Error("Fetched metadata did not match the required name and artist.");
  }
  const imageCid = metadata.image.replace(/^ipfs:\/\//, "");
  const { response: imageResponse, url: imageUrl } = await fetchFromGateways(imageCid, "image/png");
  const imageBytes = Buffer.from(await imageResponse.arrayBuffer());
  const outputPath = path.join(PROJECT_ROOT, "mint/output", `token-${tokenId}.png`);
  await fs.writeFile(outputPath, imageBytes);

  const [wallet1] = await hre.ethers.getSigners();
  console.log(`Network: BNB Smart Chain Testnet (97)`);
  console.log(`Contract: ${address}`);
  console.log(`Token id: ${tokenId}`);
  console.log(`ownerOf(${tokenId}): ${owner}`);
  console.log(`Owner is configured wallet 1: ${owner.toLowerCase() === wallet1.address.toLowerCase()}`);
  console.log(`tokenURI(${tokenId}): ${tokenUri}`);
  console.log(`Name: ${metadata.name}`);
  console.log(`Artist: ${metadata.artist}`);
  console.log(`Image: ${imageUrl}`);
  console.log(`Metadata gateway used: ${metadataUrl}`);
  console.log(`Downloaded image: ${path.relative(PROJECT_ROOT, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
