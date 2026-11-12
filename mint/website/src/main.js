import { BrowserProvider, Contract } from "ethers";
import deployment from "./deployment.json";
import "./style.css";

const TESTNET = {
  chainId: "0x61",
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: ["https://bsc-testnet-dataseed.bnbchain.org"],
  blockExplorerUrls: ["https://testnet.bscscan.com"]
};
const EXPLORER = "https://testnet.bscscan.com";

const connectButton = document.querySelector("#connect-button");
const mintButton = document.querySelector("#mint-button");
const walletLabel = document.querySelector("#wallet-label");
const supplyCount = document.querySelector("#supply-count");
const statusMessage = document.querySelector("#status-message");
const resultCard = document.querySelector("#result-card");
let provider;
let signer;
let collection;
let connectedAddress;
let lastTransactionHash;

function setStatus(message, kind = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${kind}`.trim();
}

function decodeJsonDataUri(uri) {
  const prefix = "data:application/json;base64,";
  if (!uri.startsWith(prefix)) throw new Error("This contract did not return an embedded metadata data URI.");
  const binary = atob(uri.slice(prefix.length));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

async function switchToTestnet() {
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current === TESTNET.chainId) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: TESTNET.chainId }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [TESTNET] });
  }
}

async function refreshCollection() {
  if (!collection) {
    supplyCount.textContent = "— / 42";
    mintButton.disabled = true;
    return;
  }
  const [minted, cap, alreadyMinted] = await Promise.all([
    collection.totalMinted(),
    collection.MAX_SUPPLY(),
    collection.hasPublicMinted(connectedAddress)
  ]);
  supplyCount.textContent = `${minted.toString()} / ${cap.toString()}`;
  if (BigInt(minted) >= BigInt(cap)) {
    mintButton.disabled = true;
    mintButton.innerHTML = 'Collection sold out <span aria-hidden="true">✓</span>';
  } else if (alreadyMinted) {
    mintButton.disabled = true;
    mintButton.innerHTML = 'Already minted <span aria-hidden="true">✓</span>';
  } else {
    mintButton.disabled = false;
    mintButton.innerHTML = 'Mint your NFT <span aria-hidden="true">↗</span>';
  }
}

async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask was not found. Install MetaMask and try again.");
  if (!deployment.address || !Array.isArray(deployment.abi) || deployment.abi.length === 0) {
    throw new Error("The contract is not deployed yet. Run the on-chain testnet deploy step first.");
  }
  await switchToTestnet();
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts.length) throw new Error("MetaMask did not return an account.");
  provider = new BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  connectedAddress = accounts[0];
  collection = new Contract(deployment.address, deployment.abi, signer);
  walletLabel.textContent = `Connected wallet ${shortAddress(connectedAddress)}`;
  connectButton.textContent = shortAddress(connectedAddress);
  await refreshCollection();
  setStatus("Wallet connected to BNB Smart Chain Testnet.", "success");
}

async function showMintedToken(tokenId, transactionHash) {
  const [owner, uri] = await Promise.all([collection.ownerOf(tokenId), collection.tokenURI(tokenId)]);
  const metadata = decodeJsonDataUri(uri);
  resultCard.hidden = false;
  document.querySelector("#result-image").src = metadata.image;
  document.querySelector("#result-name").textContent = metadata.name;
  document.querySelector("#result-owner").textContent = `Owner: ${owner}`;
  const transactionLink = document.querySelector("#transaction-link");
  transactionLink.href = `${EXPLORER}/tx/${transactionHash}`;
  lastTransactionHash = transactionHash;
  await refreshCollection();
}

connectButton.addEventListener("click", async () => {
  connectButton.disabled = true;
  try {
    await connectWallet();
  } catch (error) {
    const message = error.code === 4001 ? "Wallet connection was cancelled." : error.message;
    setStatus(message, "error");
  } finally {
    connectButton.disabled = false;
  }
});

mintButton.addEventListener("click", async () => {
  if (!collection) return;
  mintButton.disabled = true;
  mintButton.textContent = "Confirm in MetaMask…";
  try {
    await switchToTestnet();
    const transaction = await collection.publicMint();
    setStatus("Transaction submitted. Waiting for BNB Smart Chain Testnet…", "pending");
    const receipt = await transaction.wait();
    const transferEvent = receipt.logs.map((log) => {
      try { return collection.interface.parseLog(log); } catch { return null; }
    }).find((event) => event?.name === "Transfer" && event.args.from === "0x0000000000000000000000000000000000000000");
    if (!transferEvent) throw new Error("Mint confirmed, but the token id could not be read from the receipt.");
    const tokenId = transferEvent.args.tokenId.toString();
    setStatus(`Mint confirmed. Token #${tokenId} belongs to ${shortAddress(connectedAddress)}.`, "success");
    await showMintedToken(tokenId, receipt.hash);
  } catch (error) {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      setStatus("You cancelled the transaction in MetaMask.", "error");
    } else if ((error.shortMessage || error.message || "").includes("already minted")) {
      setStatus("This wallet has already used its one public mint.", "error");
    } else if ((error.shortMessage || error.message || "").includes("maximum supply")) {
      setStatus("The collection has reached its 42-token supply cap.", "error");
    } else {
      setStatus(error.shortMessage || error.message || "Mint failed. Check your wallet and network.", "error");
    }
  } finally {
    mintButton.disabled = false;
    if (lastTransactionHash) await refreshCollection().catch(() => {});
  }
});

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}

if (!deployment.address) {
  setStatus("Waiting for the on-chain contract deployment. This page contains no private keys.");
} else {
  setStatus("Connect your wallet to check availability.");
}
