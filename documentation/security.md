# Security model and review notes

## Privileges

The required `TokenizeArt` contract uses OpenZeppelin `Ownable`. Only its owner may call `mintArt`, and the cap is fixed at 42. The owner cannot transfer a token they do not own, change a token URI after minting, charge fees, burn tokens, or upgrade the code. Standard `transferOwnership` moves the collection-owner role.

The bonus `TokenizeArtOnChain` contract exposes `publicMint`, limited to one call per address, and `ownerMint`, available only to the collection owner. Both use the same fixed cap. Owner minting can distribute tokens but cannot bypass the cap. A token owner remains distinct from the contract owner.

## Mint ordering and callbacks

ERC-721 safe minting calls `onERC721Received` on a contract recipient. A receiver can run code during that callback. Both contracts therefore increment their minted counter and record token ownership before calling `ERC721Utils.checkOnERC721Received`. The required contract also stores the token URI before the callback. If a receiver rejects the token or reverts, EVM transaction rollback undoes the mint and counter update.

The public-mint flag is set before `_mintArt` invokes the receiver hook. That prevents a receiver callback from entering `publicMint` again. The public mint is free in contract code; wallet users still pay testnet gas.

## Storage and key risks

IPFS files are public. A CID detects content changes, but does not ensure permanent availability; keep Pinata or another IPFS node pinning the image and metadata. The on-chain edition embeds all art and metadata into `tokenURI`, so it does not rely on a gateway but costs more to mint and read.

Private keys and the Pinata JWT belong in `deployment/.env`, which is ignored. The website contains only public contract address and ABI. Never put keys into Vite variables, browser storage, source code, Git, screenshots, logs, or chat. If a test key is exposed, replace it and move any remaining test funds.

## Scope limits

This is a student testnet project, not an audited production deployment. The contracts intentionally omit upgradeability, royalties, marketplace rules, fees, and pausing. Testnet endpoints and explorer services can be unavailable, and a testnet deployment is not a guarantee of permanence on mainnet.
