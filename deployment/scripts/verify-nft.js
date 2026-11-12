const hre = require("hardhat");
const { readDeployments } = require("./mint/utils");

async function main() {
  const deployments = await readDeployments();
  const address = deployments.ipfs?.address;
  if (!address) throw new Error("No IPFS contract address found. Run npm run deploy:testnet first.");
  const constructorArguments = [];
  await hre.run("verify:verify", { address, constructorArguments });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
