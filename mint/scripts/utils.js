const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

function findProjectRoot(scriptDirectory) {
  const candidates = [
    path.resolve(scriptDirectory, "../.."),
    path.resolve(scriptDirectory, "../../.."),
    path.resolve(scriptDirectory, "../../../..")
  ];
  return candidates.find((candidate) =>
    fsSync.existsSync(path.join(candidate, "deployment", "package.json")) &&
    fsSync.existsSync(path.join(candidate, "code", "contracts"))
  ) || path.resolve(process.cwd(), "..");
}

const PROJECT_ROOT = findProjectRoot(__dirname);
let dotenv;
try {
  dotenv = require("dotenv");
} catch {
  dotenv = require(path.join(PROJECT_ROOT, "deployment/node_modules/dotenv"));
}
dotenv.config({ path: path.join(PROJECT_ROOT, "deployment/.env") });

const deploymentPath = path.join(PROJECT_ROOT, "deployment/deployments/bscTestnet.json");

async function readDeployments() {
  try {
    return JSON.parse(await fs.readFile(deploymentPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return { network: "BNB Smart Chain Testnet", chainId: 97, ipfs: null, onChain: null };
    }
    throw error;
  }
}

async function writeDeployments(record) {
  await fs.mkdir(path.dirname(deploymentPath), { recursive: true });
  await fs.writeFile(deploymentPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
}

function getGatewayBase() {
  return (process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud").replace(/\/+$/, "");
}

function ipfsGatewayUrl(cid, gateway = getGatewayBase()) {
  const base = gateway.replace(/\/+$/, "");
  return `${base}/ipfs/${cid}`;
}

function ipfsUriToGatewayUrl(uri, gateway = getGatewayBase()) {
  if (!uri.startsWith("ipfs://")) throw new Error(`Expected an ipfs:// URI, got: ${uri}`);
  return ipfsGatewayUrl(uri.slice("ipfs://".length), gateway);
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

module.exports = {
  PROJECT_ROOT,
  deploymentPath,
  getGatewayBase,
  ipfsGatewayUrl,
  ipfsUriToGatewayUrl,
  readDeployments,
  writeDeployments,
  writeJson
};
