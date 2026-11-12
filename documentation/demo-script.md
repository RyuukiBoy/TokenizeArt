# TokenizeArt 42 defense walkthrough

Use this order for a 5–8 minute demonstration. The live deployment and both mint paths have already succeeded on BNB Smart Chain Testnet (chain ID 97).

## Before the defense

- Keep `deployment/.env` private and off screen share. Never show or paste wallet keys or the Pinata JWT.
- Open the project terminal at `deployment/` and the built site at `mint/website/`.
- Prepare the PNG, Pinata gateway URLs, and the two BscScan contract pages in browser tabs.
- Use MetaMask on BNB Smart Chain Testnet. The connected test wallet already used its one public mint, so the website should show **Already minted**; do not try to mint again from that wallet.
- Keep these commands ready as proof if the evaluator asks for tests or a token read:

```bash
corepack pnpm run compile
corepack pnpm test
corepack pnpm run coverage
corepack pnpm run display:testnet
ONCHAIN_TOKEN_ID=2 corepack pnpm run onchain:display:testnet
```

## 1. Introduce the project and artwork

Show `mint/assets/neon-eagle.png`, then the editable `mint/assets/neon-eagle.svg`. Point out the vector-drawn **42** and say:

> “TokenizeArt 42 is an ERC-721 collection capped at 42 tokens. I built a required IPFS-backed edition and a separate on-chain bonus edition, then tested both on BNB Smart Chain Testnet.”

## 2. Prove the contracts were tested

Show the terminal output for compile, tests, and coverage. Report the results accurately:

- 8 tests pass.
- 100% statements, functions, and lines; 84.38% branches.
- The tests cover the supply cap, owner-only minting, transfers, the public one-mint-per-wallet rule, and on-chain JSON/SVG metadata.

## 3. Demonstrate the required IPFS edition

Open `mint/output/ipfs.json` and show both CIDs and gateway results. Open the **Pinata gateway** URLs for the image and metadata. Explain the path:

> “The image is pinned to IPFS. The metadata JSON points to the image CID. The ERC-721 token URI points to the metadata CID.”

The recorded image CID is `bafybeidbqz5l3vv3q62vcxmdyuhmi5vdan3ejo42unyx5q4d7m5vb53pxy`. The metadata CID is `bafkreianwp3yjvrbyfsm5skaozoj2mkb5qmxvqew546owmyw6fbnuqeidm`.

Show the [verified TokenizeArt contract](https://testnet.bscscan.com/address/0x36ab44AAFEe61DeBcBcfe81Ba6dDFB076ac4D6F8#code), its [deployment transaction](https://testnet.bscscan.com/tx/0x2108b67dfbbf8b22cb5aac9f0fa0247b3c424268cfbc15c00dd31cda5d6c62f0), and its [mint transaction for token 1](https://testnet.bscscan.com/tx/0xff209e3449c077a4b4dc43704faabddf4781aeff8dc6b8174fd7491c58737565). Run `corepack pnpm run display:testnet` if asked to demonstrate the read directly. Point to `ownerOf(1)`, the `ipfs://` token URI, name **42 Neon Eagle**, artist **oait-bad**, and the resolved image.

Explain that the **collection owner** can add tokens to the required edition, while `ownerOf(1)` identifies the current owner of token 1; those roles can differ after a transfer.

## 4. Demonstrate the on-chain bonus

Show the [verified TokenizeArtOnChain contract](https://testnet.bscscan.com/address/0xdbdFc535dF1C5839Af7673Fa1a2aDD535903c3d6#code), then explain:

> “This separate bonus stores its JSON and SVG inside the token URI. It supports owner minting and public minting, limits each wallet to one public mint, and shares the 42-token cap.”

Token 1 was minted by the owner script. Token 2 was minted through the website. Show the [website public-mint transaction](https://testnet.bscscan.com/tx/0x64c32361513818c8c84471467f9eeded3794bcf268f5e93c7aa8590eaa394c58), then run:

```bash
ONCHAIN_TOKEN_ID=2 corepack pnpm run onchain:display:testnet
```

Show `ownerOf(2)`, the decoded metadata, and `mint/output/onchain-token-2.svg`. BscScan may show a generic thumbnail for embedded SVG metadata; the display script and website demonstrate the SVG itself.

## 5. Demonstrate the website

Show the site at `http://127.0.0.1:5173`, with MetaMask connected on BNB Smart Chain Testnet. Point out the wallet address, supply, and the already-used public-mint state. The successful token 2 transaction above proves the website called `publicMint` and MetaMask confirmed the transaction.

## If asked about a gateway warning

Pinata returned HTTP 200 for both uploaded files. `ipfs.io` rate-limited the checks with HTTP 429. The CIDs and successful Pinata gateway checks are recorded in `mint/output/ipfs.json`; the uploader accepts at least one reachable public gateway per file and records all gateway results.

## Closing summary

> “The required ERC-721 is verified and points to public IPFS metadata. The bonus ERC-721 is verified and embeds its artwork on-chain. I demonstrated tests, ownership reads, both mint paths, and the MetaMask website flow on testnet.”
