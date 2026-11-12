# IPFS and storage

## IPFS, CIDs and gateways

IPFS is a network for addressing content by its contents. A **CID** is the identifier produced for a file. If the file changes, it has a different CID. An `ipfs://CID` URI is portable; an HTTP **gateway** translates it into a URL a browser can open.

IPFS addressing does not promise that a file stays available. **Pinning** asks a service to retain the file and serve it when requested. This project uses Pinata's public file upload endpoint and a JWT stored only in `deployment/.env`. The image is uploaded first. The returned image CID is written into `metadata.json`, then that JSON is uploaded.

The upload script writes `mint/output/ipfs.json` with both CIDs, both `ipfs://` URIs, gateway URLs and gateway check results. It checks `gateway.pinata.cloud` and `ipfs.io`. The user should rerun or investigate the check if either file is not available through both gateways before minting.

## Pinata free tier

At the time this project was prepared, Pinata's pricing page listed 1 GB storage and 500 files on its free plan. Limits and features can change, so check [Pinata pricing](https://pinata.cloud/pricing) before an upload. The image and metadata are public and should never contain private information.

## On-chain storage tradeoff

In the mandatory edition, the blockchain stores a short IPFS URI, while the image and JSON are pinned off-chain. This is cheaper and keeps the contract small, but the pinning service or another IPFS node must retain the files. In the on-chain edition, both the image SVG and metadata are included in the `tokenURI` data URI. That removes the gateway dependency but increases transaction and storage costs.

## Upload endpoint

The script uses Pinata's current Files API upload endpoint (`POST https://uploads.pinata.cloud/v3/files`) with bearer authentication and multipart form data. It sets `network=public` so the returned CID is publicly retrievable. The JWT is never sent to the website and the script never prints it.
