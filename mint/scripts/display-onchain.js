const fs = require("node:fs/promises");
const path = require("node:path");
const hre = require("hardhat");
const { PROJECT_ROOT, readDeployments } = require("./utils");

function decodeDataUri(uri, prefix) {
  if (!uri.startsWith(prefix)) throw new Error(`Expected data URI with prefix ${prefix}`);
  return Buffer.from(uri.slice(prefix.length), "base64").toString("utf8");
}

async function main() {
  const chainId = Number(BigInt(await hre.network.provider.send("eth_chainId")));
  if (chainId !== 97) throw new Error(`Display is configured for BSC Testnet (97); current chain is ${chainId}.`);
  const deployments = await readDeployments();
  const address = deployments.onChain?.address;
  if (!address) throw new Error("No on-chain contract address found. Run npm run onchain:deploy:testnet first.");
  const tokenId = process.env.ONCHAIN_TOKEN_ID || deployments.onChain.tokenId || "1";
  const collection = await hre.ethers.getContractAt("TokenizeArtOnChain", address, hre.ethers.provider);
  const owner = await collection.ownerOf(tokenId);
  const tokenUri = await collection.tokenURI(tokenId);
  const metadata = JSON.parse(decodeDataUri(tokenUri, "data:application/json;base64,"));
  const svg = decodeDataUri(metadata.image, "data:image/svg+xml;base64,");
  const svgPath = path.join(PROJECT_ROOT, "mint/output", `onchain-token-${tokenId}.svg`);
  await fs.writeFile(svgPath, svg, "utf8");
  console.log(`Network: BNB Smart Chain Testnet (97)`);
  console.log(`Contract: ${address}`);
  console.log(`Token id: ${tokenId}`);
  console.log(`ownerOf(${tokenId}): ${owner}`);
  console.log(`Name: ${metadata.name}`);
  console.log(`Artist: ${metadata.artist}`);
  console.log(`tokenURI(${tokenId}) embeds JSON and SVG (decoded locally).`);
  console.log(`Saved SVG: ${path.relative(PROJECT_ROOT, svgPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
