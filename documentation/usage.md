# Usage guide

## Prepare wallets and tools

Install Node.js 20+, Git and MetaMask. Create or reuse test-only wallets; do not use wallets holding real funds. In MetaMask, add BNB Smart Chain Testnet (chain ID 97, symbol `tBNB`) using an endpoint from the [BNB Chain network docs](https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/). Get tBNB from the [official faucet](https://docs.bnbchain.org/bnb-smart-chain/developers/faucet/).

From the project root:

```bash
cd deployment
corepack pnpm install --frozen-lockfile
cp .env.example .env
```

If pnpm stops with `ERR_PNPM_IGNORED_BUILDS` in `deployment/`, run `corepack pnpm approve-builds` and approve `keccak`, `secp256k1`, and `sharp`, then rerun the install. In `mint/website/`, approve `esbuild` if prompted. Review any other package names before approving them.

In Windows PowerShell, use `Copy-Item .env.example .env`. Fill the values in `deployment/.env` locally. Wallet 1 is the contract owner; wallet 2 can be used to demonstrate transfers. Never send private keys or the Pinata JWT in chat, and never add `.env` to Git.

## Build and test

From `deployment/`:

```bash
pnpm run compile
pnpm test
pnpm run coverage
node ../mint/scripts/build-art.js
```

Open `mint/assets/neon-eagle.png` to inspect the clear vector 42. Review code in `code/contracts/`; `deployment/contracts/` is only a generated Hardhat copy.

## Required IPFS demonstration

1. Set `PINATA_JWT` in `deployment/.env`.
2. Run `pnpm run ipfs:upload`. Check the image and metadata gateway results in `mint/output/ipfs.json`. At least one gateway must fetch each file; a second gateway may temporarily rate-limit requests.
3. Run `pnpm run deploy:testnet`, then `pnpm run verify:testnet`.
4. Run `pnpm run mint:testnet`, then `pnpm run display:testnet`.
5. Show the BscScan transaction and `ownerOf(1)`. Open the metadata and image gateway links. The owner should match wallet 1.

The scripts refuse mint/display if the connected chain is not 97. They read the deployment record and CIDs saved by the earlier steps.

## On-chain bonus demonstration

After the required edition is proven:

```bash
pnpm run onchain:deploy:testnet
pnpm run onchain:verify:testnet
pnpm run onchain:mint:testnet
pnpm run onchain:display:testnet
```

The last command prints `ownerOf`, decodes the `tokenURI` JSON locally, and writes the embedded image to `mint/output/onchain-token-1.svg`.

## Mint website

After deploying the on-chain contract, the deploy script fills `mint/website/src/deployment.json` with its address, chain ID and ABI. Then, from `deployment/`:

```bash
cd ../mint/website
corepack pnpm install --frozen-lockfile
pnpm run dev
```

Connect MetaMask, switch to BNB Smart Chain Testnet, and select **Mint your NFT**. Confirm the transaction in MetaMask. The page shows the supply, transaction link, on-chain SVG and `ownerOf` result. The website never handles private keys. For a static build use `pnpm run build`; publish only the `dist/` directory.

## Import in MetaMask

If the wallet does not show the NFT automatically, use MetaMask's import NFT flow and enter the relevant contract address and token id. Testnet NFT display support varies by wallet.
