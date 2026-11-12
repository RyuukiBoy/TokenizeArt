const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenizeArt", function () {
  async function deployCollection() {
    const [owner, artistWallet, otherWallet] = await ethers.getSigners();
    const TokenizeArt = await ethers.getContractFactory("TokenizeArt");
    const collection = await TokenizeArt.deploy();
    await collection.waitForDeployment();
    return { collection, owner, artistWallet, otherWallet };
  }

  it("uses the required name, symbol, cap, and token ids starting at one", async function () {
    const { collection, owner, artistWallet } = await deployCollection();
    expect(await collection.name()).to.equal("TokenizeArt 42");
    expect(await collection.symbol()).to.equal("TA42");
    expect(await collection.MAX_SUPPLY()).to.equal(42n);

    await expect(collection.mintArt(artistWallet.address, "ipfs://metadata-1"))
      .to.emit(collection, "ArtMinted")
      .withArgs(1n, artistWallet.address, "ipfs://metadata-1");
    expect(await collection.ownerOf(1)).to.equal(artistWallet.address);
    expect(await collection.tokenURI(1)).to.equal("ipfs://metadata-1");
    expect(await collection.balanceOf(artistWallet.address)).to.equal(1n);
    expect(await collection.totalMinted()).to.equal(1n);
    expect(await collection.owner()).to.equal(owner.address);
  });

  it("restricts minting and rejects invalid mint arguments", async function () {
    const { collection, artistWallet, otherWallet } = await deployCollection();
    await expect(collection.connect(otherWallet).mintArt(artistWallet.address, "ipfs://x"))
      .to.be.revertedWithCustomError(collection, "OwnableUnauthorizedAccount")
      .withArgs(otherWallet.address);
    await expect(collection.mintArt(ethers.ZeroAddress, "ipfs://x"))
      .to.be.revertedWith("TokenizeArt: mint to zero address");
    await expect(collection.mintArt(artistWallet.address, ""))
      .to.be.revertedWith("TokenizeArt: empty token URI");
    await expect(collection.ownerOf(1)).to.be.revertedWithCustomError(collection, "ERC721NonexistentToken");
    await expect(collection.tokenURI(1)).to.be.revertedWithCustomError(collection, "ERC721NonexistentToken");
  });

  it("caps supply at 42 and rolls back when a receiver rejects the mint", async function () {
    const { collection, artistWallet } = await deployCollection();
    for (let tokenId = 1; tokenId <= 42; tokenId += 1) {
      await collection.mintArt(artistWallet.address, `ipfs://metadata-${tokenId}`);
    }
    expect(await collection.totalMinted()).to.equal(42n);
    await expect(collection.mintArt(artistWallet.address, "ipfs://too-many"))
      .to.be.revertedWith("TokenizeArt: maximum supply reached");

    const NonReceiver = await ethers.getContractFactory("NonReceiver");
    const nonReceiver = await NonReceiver.deploy();
    await nonReceiver.waitForDeployment();
    const fresh = await deployCollection();
    await expect(fresh.collection.mintArt(await nonReceiver.getAddress(), "ipfs://rejected"))
      .to.be.revertedWithCustomError(fresh.collection, "ERC721InvalidReceiver");
    expect(await fresh.collection.totalMinted()).to.equal(0n);
  });

  it("supports standard approvals, transfers, and ownership transfer", async function () {
    const { collection, owner, artistWallet, otherWallet } = await deployCollection();
    await collection.mintArt(artistWallet.address, "ipfs://one");
    await collection.connect(artistWallet).approve(otherWallet.address, 1);
    await collection.connect(otherWallet).transferFrom(artistWallet.address, owner.address, 1);
    expect(await collection.ownerOf(1)).to.equal(owner.address);

    await collection.connect(owner).setApprovalForAll(otherWallet.address, true);
    await collection.connect(otherWallet).safeTransferFrom(owner.address, artistWallet.address, 1);
    expect(await collection.ownerOf(1)).to.equal(artistWallet.address);

    await collection.transferOwnership(otherWallet.address);
    expect(await collection.owner()).to.equal(otherWallet.address);
    await expect(collection.mintArt(owner.address, "ipfs://two"))
      .to.be.revertedWithCustomError(collection, "OwnableUnauthorizedAccount")
      .withArgs(owner.address);
    await collection.connect(otherWallet).mintArt(owner.address, "ipfs://two");
  });
});
