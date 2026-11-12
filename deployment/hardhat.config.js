require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("./scripts/prepare-contracts");

const privateKeys = [process.env.PRIVATE_KEY, process.env.PRIVATE_KEY_2]
  .filter((key) => typeof key === "string" && key.trim().length > 0);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      // Paris avoids PUSH0 on EVM chains whose fork support may lag Shanghai.
      evmVersion: "paris"
    }
  },
  paths: {
    // Canonical sources stay in code/; the config hook mirrors them into the
    // ignored Hardhat directories because Hardhat requires paths under root.
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet-dataseed.bnbchain.org",
      chainId: 97,
      accounts: privateKeys
    }
  },
  etherscan: {
    // Etherscan API V2 uses one key for all supported networks.
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  sourcify: { enabled: false },
  mocha: { timeout: 60000 }
};
