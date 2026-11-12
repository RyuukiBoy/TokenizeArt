const { expect } = require("chai");
const { ethers } = require("hardhat");

function decodeBase64Uri(uri, expectedPrefix) {
  expect(uri.startsWith(expectedPrefix)).to.equal(true);
  return Buffer.from(uri.slice(expectedPrefix.length), "base64").toString("utf8");
}

describe("TokenizeArtOnChain", function () {
  async function deployCollection(artistName = "oait-bad") {
    const [owner, minter, otherWallet] = await ethers.getSigners();
    const TokenizeArtOnChain = await ethers.getContractFactory("TokenizeArtOnChain");
    const collection = await TokenizeArtOnChain.deploy("TokenizeArt 42 On-Chain", "TA42C", artistName);
    await collection.waitForDeployment();
    return { collection, owner, minter, otherWallet };
  }

  it("embeds valid JSON and a readable vector 42 in each token URI", async function () {
    const { collection, minter } = await deployCollection();
    await collection.connect(minter).publicMint();
    const jsonText = decodeBase64Uri(await collection.tokenURI(1), "data:application/json;base64,");
    const metadata = JSON.parse(jsonText);
    expect(metadata.name).to.equal("42 Neon Eagle #1");
    expect(metadata.artist).to.equal("oait-bad");
    expect(metadata.attributes[0].value).to.equal("oait-bad");
    expect(metadata.image.startsWith("data:image/svg+xml;base64,")).to.equal(true);

    const svg = decodeBase64Uri(metadata.image, "data:image/svg+xml;base64,");
    expect(svg).to.include("<svg xmlns=");
    expect(svg).to.include("M181 245v-70");
    expect(svg).to.include("M337 211q13-36");
    expect(await collection.ownerOf(1)).to.equal(minter.address);
    expect(await collection.totalMinted()).to.equal(1n);
  });

  it("limits public minting to once per wallet and owner minting to the owner", async function () {
    const { collection, minter, otherWallet } = await deployCollection();
    await collection.connect(minter).publicMint();
    await expect(collection.connect(minter).publicMint())
      .to.be.revertedWith("TokenizeArtOnChain: wallet already minted");
    await expect(collection.connect(otherWallet).ownerMint(otherWallet.address))
      .to.be.revertedWithCustomError(collection, "OwnableUnauthorizedAccount")
      .withArgs(otherWallet.address);
  });

  it("caps the combined public and owner mint paths at 42", async function () {
    const { collection, minter } = await deployCollection();
    await collection.connect(minter).publicMint();
    for (let tokenId = 2; tokenId <= 42; tokenId += 1) {
      await collection.ownerMint(minter.address);
    }
    expect(await collection.totalMinted()).to.equal(42n);
    await expect(collection.ownerMint(minter.address))
      .to.be.revertedWith("TokenizeArtOnChain: maximum supply reached");
  });

  it("uses different palettes, escapes artist strings, and rejects nonexistent ids", async function () {
    const { collection, minter, otherWallet } = await deployCollection('artist "line"\nnext');
    await collection.ownerMint(minter.address);
    await collection.ownerMint(minter.address);
    const first = JSON.parse(decodeBase64Uri(await collection.tokenURI(1), "data:application/json;base64,"));
    const second = JSON.parse(decodeBase64Uri(await collection.tokenURI(2), "data:application/json;base64,"));
    expect(first.artist).to.equal('artist "line"\nnext');
    expect(first.image).not.to.equal(second.image);
    await expect(collection.tokenURI(3)).to.be.revertedWithCustomError(collection, "ERC721NonexistentToken");

    const NonReceiver = await ethers.getContractFactory("NonReceiver");
    const nonReceiver = await NonReceiver.deploy();
    await nonReceiver.waitForDeployment();
    const fresh = await deployCollection();
    await expect(fresh.collection.ownerMint(await nonReceiver.getAddress()))
      .to.be.revertedWithCustomError(fresh.collection, "ERC721InvalidReceiver");
    expect(await fresh.collection.totalMinted()).to.equal(0n);
    expect(await fresh.collection.hasPublicMinted(otherWallet.address)).to.equal(false);
  });
});
