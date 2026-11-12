const fs = require("node:fs/promises");
const path = require("node:path");
const { PROJECT_ROOT, ipfsGatewayUrl, writeJson } = require("./utils");

const imagePath = path.join(PROJECT_ROOT, "mint/assets/neon-eagle.png");
const metadataPath = path.join(PROJECT_ROOT, "mint/metadata/metadata.json");
const outputPath = path.join(PROJECT_ROOT, "mint/output/ipfs.json");
const publicGateways = ["https://gateway.pinata.cloud", "https://ipfs.io"];

async function uploadFile(fileBytes, filename, contentType) {
  const form = new FormData();
  form.append("network", "public");
  form.append("name", filename);
  form.append("file", new Blob([fileBytes], { type: contentType }), filename);

  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    body: form
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Pinata upload failed (${response.status}): ${body.error || body.message || response.statusText}`);
  }
  const cid = body.data?.cid || body.cid;
  if (!cid) throw new Error("Pinata response did not include a CID.");
  return cid;
}

async function checkGateway(cid, filename) {
  const results = [];
  for (const gateway of publicGateways) {
    const url = ipfsGatewayUrl(cid, gateway);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      results.push({ gateway, url, status: response.status, reachable: response.ok });
      if (response.ok && filename.endsWith(".json")) {
        const content = await response.json();
        if (!content.image) throw new Error("Gateway returned metadata without an image field.");
      } else if (response.ok) {
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength === 0) throw new Error("Gateway returned an empty image.");
      }
    } catch (error) {
      results.push({ gateway, url, reachable: false, error: error.message });
    }
  }
  return results;
}

async function main() {
  if (!process.env.PINATA_JWT) throw new Error("PINATA_JWT is missing. Set it in deployment/.env; never paste it into chat.");
  const imageBytes = await fs.readFile(imagePath);
  const imageCid = await uploadFile(imageBytes, "neon-eagle.png", "image/png");
  const metadata = {
    name: "42 Neon Eagle",
    description: "A geometric neon eagle crest with a vector-drawn 42, created for the TokenizeArt 42 collection.",
    image: `ipfs://${imageCid}`,
    artist: "oait-bad",
    attributes: [
      { trait_type: "Artist", value: "oait-bad" },
      { trait_type: "Collection", value: "TokenizeArt 42" }
    ]
  };
  const metadataBytes = Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  const metadataCid = await uploadFile(metadataBytes, "metadata.json", "application/json");
  await fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  const imageGatewayChecks = await checkGateway(imageCid, "neon-eagle.png");
  const metadataGatewayChecks = await checkGateway(metadataCid, "metadata.json");
  const reachableImageGateways = imageGatewayChecks.filter((item) => item.reachable);
  const reachableMetadataGateways = metadataGatewayChecks.filter((item) => item.reachable);
  const result = {
    imageCid,
    metadataCid,
    imageUri: `ipfs://${imageCid}`,
    metadataUri: `ipfs://${metadataCid}`,
    imageGatewayUrls: publicGateways.map((gateway) => ipfsGatewayUrl(imageCid, gateway)),
    metadataGatewayUrls: publicGateways.map((gateway) => ipfsGatewayUrl(metadataCid, gateway)),
    gatewayChecks: { image: imageGatewayChecks, metadata: metadataGatewayChecks },
    uploadedAt: new Date().toISOString()
  };
  await writeJson(outputPath, result);

  for (const check of [...imageGatewayChecks, ...metadataGatewayChecks]) {
    console.log(`${check.reachable ? "OK" : "NO"} ${check.url} (${check.status || check.error})`);
  }

  if (reachableImageGateways.length === 0 || reachableMetadataGateways.length === 0) {
    throw new Error("Uploads are pinned, but no public gateway could fetch the image or metadata. Check gatewayChecks in mint/output/ipfs.json before minting.");
  }

  console.log(`Image CID: ${imageCid}`);
  console.log(`Metadata CID: ${metadataCid}`);
  console.log(`Metadata URI: ${result.metadataUri}`);
  console.log(`Saved CIDs and gateway results to mint/output/ipfs.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
