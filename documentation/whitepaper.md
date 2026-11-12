# TokenizeArt 42 — Collection note

## Purpose

TokenizeArt 42 is a small 42 School NFT project for BNB Smart Chain Testnet. The artwork is an original geometric eagle crest, built from SVG shapes and paths. Its main feature is the large, readable number 42, drawn as vector paths rather than font text. The artist recorded in the metadata is `oait-bad`.

## The two editions

The required edition is an ERC-721 collection named **TokenizeArt 42** (`TA42`). Each token points to a JSON metadata file on IPFS. That JSON points to the 1024 × 1024 PNG image. The contract caps the edition at 42 tokens and assigns token IDs from 1 upward.

The optional on-chain edition is a separate ERC-721 collection named **TokenizeArt 42 On-Chain** (`TA42C`). It encodes a compact SVG and metadata JSON into the `tokenURI` data URI. The token id selects one of three accent palettes while keeping the vector 42 unchanged and readable.

## Ownership

Every token has one current owner. The standard `ownerOf(tokenId)` call provides the ownership proof; the standard ERC-721 transfer and approval functions allow the owner to move or delegate transfer access to a token. The collection owner is a different role. For the required edition, the collection owner is allowed to mint up to the fixed cap. For the bonus edition, any wallet can mint once, and the collection owner has an additional capped mint function.

## Status

The artwork has been rendered and approved. Contract addresses, transaction hashes, CIDs and wallet ownership are added to the project only after actual testnet deployment and IPFS upload. Until then, the deployment record is a template and no token is claimed to exist on a public chain.
