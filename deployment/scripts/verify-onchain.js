const hre = require("hardhat");
const { readDeployments } = require("./mint/utils");

async function main() {
  const deployments = await readDeployments();
  const address = deployments.onChain?.address;
  if (!address) throw new Error("No on-chain contract address found. Run npm run onchain:deploy:testnet first.");
  const constructorArguments = ["TokenizeArt 42 On-Chain", "TA42C", "oait-bad"];
  await hre.run("verify:verify", { address, constructorArguments });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
