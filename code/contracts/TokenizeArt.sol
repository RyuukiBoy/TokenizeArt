// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Utils} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol";

/**
 * @title TokenizeArt
 * @notice A capped ERC-721 collection whose metadata is stored on IPFS.
 * @dev The owner may create up to 42 tokens. This contract has no fees,
 *      burn function, upgrade hook, or owner powers beyond minting and the
 *      standard Ownable ownership transfer.
 */
contract TokenizeArt is ERC721URIStorage, Ownable {
    /// @notice Maximum number of NFTs in this collection.
    uint256 public constant MAX_SUPPLY = 42;

    /// @dev The next token id is also the number of tokens already minted.
    uint256 private _totalMinted;

    /// @notice Emitted after a token and its metadata URI are recorded.
    event ArtMinted(uint256 indexed tokenId, address indexed to, string tokenUri);

    /** @notice Creates the TokenizeArt 42 collection and makes the deployer owner. */
    constructor()
        ERC721("TokenizeArt 42", "TA42")
        Ownable(msg.sender)
    {}

    /**
     * @notice Creates the next NFT and assigns it to `to`.
     * @dev Mint counters, ownership and URI are set before calling the
     *      receiver hook. A rejected safe mint reverts the entire transaction.
     * @param to Wallet that will own the new NFT.
     * @param tokenUri IPFS URI for the NFT metadata JSON.
     * @return tokenId The newly created token id, starting at 1.
     */
    function mintArt(address to, string calldata tokenUri)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        require(to != address(0), "TokenizeArt: mint to zero address");
        require(_totalMinted < MAX_SUPPLY, "TokenizeArt: maximum supply reached");
        require(bytes(tokenUri).length > 0, "TokenizeArt: empty token URI");

        tokenId = _totalMinted + 1;

        // _mint and _setTokenURI have no external calls. Record all state
        // before invoking a contract recipient's ERC-721 receiver hook.
        _totalMinted = tokenId;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
        ERC721Utils.checkOnERC721Received(_msgSender(), address(0), to, tokenId, "");

        emit ArtMinted(tokenId, to, tokenUri);
    }

    /** @notice Returns the number of tokens created so far. */
    function totalMinted() external view returns (uint256) {
        return _totalMinted;
    }

}
