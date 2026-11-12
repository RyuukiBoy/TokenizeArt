# TokenizeArt 42 (TA42)

42 School project **TokenizeArt – Build your own NFT**, made for BNB Chain. Artist: **oait-bad**.

The mandatory collection is an ERC-721 (also called BEP-721 on BNB Chain). Its artwork and metadata are stored on IPFS. The bonus collection stores the artwork and metadata inside the contract and includes a small website for public minting.

> **Network safety:** all deployment scripts target BNB Smart Chain Testnet (chain ID 97). Use test wallets and tBNB only. Never put a mainnet key in `deployment/.env`.

## Deployment record

| Item | Value |
|---|---|
| Network | BNB Smart Chain Testnet · chain ID 97 |
| Mandatory collection | TokenizeArt 42 · TA42 |
| Mandatory contract | [TokenizeArt](https://testnet.bscscan.com/address/0x36ab44AAFEe61DeBcBcfe81Ba6dDFB076ac4D6F8) · verified |
| Minted token | Token 1 to `0x2B3EaF772dFf6753B9bc8EE155D0c75c2f126678` · [transaction](https://testnet.bscscan.com/tx/0xff209e3449c077a4b4dc43704faabddf4781aeff8dc6b8174fd7491c58737565) |
| Image and metadata CIDs | Image `bafybeidbqz5l3vv3q62vcxmdyuhmi5vdan3ejo42unyx5q4d7m5vb53pxy` · metadata `bafkreianwp3yjvrbyfsm5skaozoj2mkb5qmxvqew546owmyw6fbnuqeidm` |
| On-chain bonus contract | [TokenizeArtOnChain](https://testnet.bscscan.com/address/0xdbdFc535dF1C5839Af7673Fa1a2aDD535903c3d6) · verified |
| Bonus mints | Token 1 via owner mint; token 2 via website public mint · [transaction](https://testnet.bscscan.com/tx/0x64c32361513818c8c84471467f9eeded3794bcf268f5e93c7aa8590eaa394c58) |
| Local tests | 8 passing |
| Coverage | 100% statements / functions / lines; 84.38% branches (8 local tests) |

The scripts write deployment addresses, transaction hashes, block numbers and CIDs to `deployment/deployments/bscTestnet.json`. The website public mint is recorded there as well. All testnet values above are from the completed deployment and transactions.

## 1. What this project makes

An **NFT** is a unique token with its own number and owner. The contract records which wallet owns each token. The `ownerOf(tokenId)` function proves the current owner.

The mandatory contract stores an IPFS metadata link in each token. The metadata JSON names the artist and points to the image. The image and JSON are pinned to IPFS through Pinata so they remain available when this computer is off. IPFS files are public; do not upload private material.

The on-chain bonus embeds both the JSON metadata and an SVG image into the `tokenURI` itself. This does not rely on an IPFS gateway, but it costs more gas because the data is part of the blockchain state.

## 2. Main choices

| Choice | Reason |
|---|---|
| BNB Smart Chain Testnet | It is the BNB Chain partner network used for this project. It uses tBNB test tokens and chain ID 97. |
| Solidity 0.8.24, Hardhat 2, OpenZeppelin 5 | This matches the related Tokenizer project and uses standard ERC-721 and ownership code. |
| Maximum supply of 42 | A small fixed cap is easy to explain and audit. Token IDs start at 1. |
| Owner-only mint for the IPFS collection | Only the contract owner can add tokens, and only up to the cap. |
| No fees, burn, proxy, or upgrade function | The contracts have fewer privileges and are easier to review. |
| Pinata IPFS pinning for the required collection | IPFS CIDs identify the content; pinning asks a service to keep the content available. |
| Separate on-chain bonus contract | The mandatory contract remains small and simple; the bonus can use public minting and embedded SVG metadata. |
| Vite and vanilla JavaScript website | The mint page is small, readable, and has no server-side wallet key. MetaMask signs the transaction. |

## 3. Layout

```text
README.md
.gitignore
code/
  contracts/        Solidity contracts and a non-receiver test fixture
  test/             Hardhat tests
deployment/         Hardhat config, dependencies, deployment records
mint/
  assets/           Original SVG artwork and 1024 × 1024 PNG
  metadata/         IPFS metadata JSON
  scripts/          Upload, mint and display scripts
  output/           Generated CIDs, display images and decoded SVGs
  website/          Vite mint website for the on-chain bonus
documentation/      Whitepaper, architecture, storage, usage, security, demo
```

Hardhat 2 does not allow its source and test paths to escape its project root. Its config lives in `deployment/`; each Hardhat command copies the canonical `code/contracts/` and `code/test/` files into ignored `deployment/contracts/` and `deployment/test/` build folders. The originals remain the files to review and edit. Mint scripts are mirrored into an ignored deployment folder for the same reason.

## 4. Set up

Install Node.js 20 or newer, Git, MetaMask and a test-only wallet. From the repository root:

```bash
cd deployment
corepack pnpm install --frozen-lockfile
cp .env.example .env
```

With pnpm 10 or newer, the first deployment install may stop with `ERR_PNPM_IGNORED_BUILDS`. Run `corepack pnpm approve-builds`, approve the expected native dependencies `keccak`, `secp256k1`, and `sharp`, then rerun the install command. In `mint/website/`, approve `esbuild` if prompted. Review any other package names before approving them.

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.example .env
```

Edit `deployment/.env` locally:

```dotenv
BSC_TESTNET_RPC_URL=https://bsc-testnet-dataseed.bnbchain.org
PRIVATE_KEY=your_test_wallet_1_private_key
PRIVATE_KEY_2=your_test_wallet_2_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
PINATA_JWT=your_pinata_jwt
IPFS_GATEWAY=https://gateway.pinata.cloud
```

The `.env` file is ignored by Git. Never paste a key into chat, add it to the website, or commit it. Wallet 1 must have tBNB from the [official BNB testnet faucet](https://docs.bnbchain.org/bnb-smart-chain/developers/faucet/) for deployment and mint transactions. Wallet 2 is optional and can be used for manual transfer demonstrations.

Add BNB Smart Chain Testnet to MetaMask with chain ID `97`, symbol `tBNB`, and an RPC endpoint from the [official BNB Chain docs](https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/). Hardhat Verify includes BSC Testnet support and uses the Etherscan API V2 format; set the API key in the environment file.

## 5. Mandatory part: build, test, upload, deploy

Run these from `deployment/`:

```bash
pnpm run compile
pnpm test
pnpm run coverage
node ../mint/scripts/build-art.js
```

Open `mint/assets/neon-eagle.png` and confirm the vector-drawn 42 is clear. The editable SVG is `mint/assets/neon-eagle.svg`.

Upload the image first, then its metadata:

```bash
pnpm run ipfs:upload
```

The script uses the Pinata Files API with a bearer token from `PINATA_JWT`, stores public IPFS files, checks two public gateways, writes the real image CID into `mint/metadata/metadata.json`, and records both CIDs in `mint/output/ipfs.json`. At least one gateway must fetch each file before minting; another gateway may temporarily rate-limit requests, and its status is recorded for review.

Deploy and verify the IPFS contract:

```bash
pnpm run deploy:testnet
pnpm run verify:testnet
pnpm run mint:testnet
pnpm run display:testnet
```

The deployment command writes its actual address to `deployment/deployments/bscTestnet.json`. Minting sends token 1 to wallet 1. Display reads `ownerOf(1)` and `tokenURI(1)`, fetches the metadata and image, and saves the image under `mint/output/`. Confirm the owner address and open the printed BscScan and gateway links.

## 6. Bonus: on-chain inscription and website

Only continue after the mandatory IPFS version is deployed, minted, and displayed correctly. The on-chain bonus has its own supply cap. Anyone can call `publicMint()` once per wallet; the owner can also use `ownerMint(address)`.

```bash
pnpm run onchain:deploy:testnet
pnpm run onchain:verify:testnet
pnpm run onchain:mint:testnet
pnpm run onchain:display:testnet
```

The display script decodes the JSON and SVG from `tokenURI(1)` and saves the SVG in `mint/output/`. The deployment script writes the contract address and ABI to `mint/website/src/deployment.json`.

Run the website locally:

```bash
cd ../mint/website
corepack pnpm install --frozen-lockfile
pnpm run dev
```

Open the local URL in a browser with MetaMask installed. Connect on BNB Smart Chain Testnet, mint, confirm the transaction in MetaMask, and check the owner and BscScan link. The website contains no private keys and sends no Pinata upload requests. To host it as a static site, run `pnpm run build` and publish the generated `dist/` folder; the deployed address and ABI must be present in `src/deployment.json` first.

## 7. Contract functions and privileges

| Function | Who can call it | Effect |
|---|---|---|
| `mintArt(to, tokenUri)` | IPFS contract owner | Creates the next token, up to 42. |
| `ownerOf(tokenId)` | Anyone | Reads the wallet that owns a token. |
| `tokenURI(tokenId)` | Anyone | Reads the metadata link, or the embedded data URI in the bonus. |
| `transferFrom`, `safeTransferFrom`, approvals | Owner or approved wallet | Uses standard ERC-721 transfer rules. |
| `publicMint()` | Anyone, once per wallet | Creates one on-chain bonus token, up to 42. |
| `ownerMint(to)` | On-chain contract owner | Creates an on-chain bonus token, up to 42. |

The contract owner and the owner of token 1 are separate roles. The collection owner can mint but has no special transfer access to tokens owned by someone else. Standard OpenZeppelin ownership can be transferred.

## 8. Security and known limits

- Both mint paths set the token counter and ownership before calling a recipient contract. A rejected safe mint reverts all state changes.
- The IPFS contract owner is the only minter; the supply is fixed at 42. The on-chain public mint is limited to one call per address, with the same cap.
- The on-chain contract owner can mint to addresses up to the cap. The website uses the public mint function; it never receives a wallet key.
- IPFS links are content-addressed, so changing a file changes its CID. Availability still depends on at least one node or pinning service retaining the content.
- Pinata and gateway limits can change. The free tier currently lists 1 GB of storage and 500 files; check [Pinata pricing](https://pinata.cloud/pricing) before uploading.
- The on-chain version avoids gateway availability but consumes more gas and is not upgradeable.
- `deployment/.env` is ignored. Check Git history before sharing the repository; rotate any test key that was accidentally committed.

More detail is in [documentation/security.md](documentation/security.md).

## 9. Troubleshooting

| Problem | What to check |
|---|---|
| Insufficient funds | Use the BNB testnet faucet to get tBNB for the selected test wallet. |
| Network detection fails | Check the testnet RPC URL and chain ID 97. |
| Invalid opcode | The compiler is set to Paris for BSC compatibility; confirm you built with the checked-in config. |
| Pinata returns 401 | Check the JWT in `deployment/.env`; never print it. |
| Only one gateway responds | Wait or try again later; do not mint until both files are retrievable. |
| Verification fails | Confirm the address, constructor arguments, API key, and wait for the testnet explorer to index the deployment. |
| Token not visible in MetaMask | Import the contract address and token id manually; testnet NFT previews vary by wallet. |
| OpenZeppelin import error | Install dependencies from `deployment/` and run compile again. |

## 10. References

- [BNB Smart Chain RPC endpoints](https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/)
- [BscScan Testnet](https://testnet.bscscan.com/)
- [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [ERC-721 standard](https://eips.ethereum.org/EIPS/eip-721)
- [IPFS pinning guide](https://docs.ipfs.tech/quickstart/pin/)
- [Pinata API upload endpoint](https://docs.pinata.cloud/api-reference/endpoint/upload-a-file)
- [Hardhat Verify](https://v2.hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)
