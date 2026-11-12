// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Utils} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TokenizeArtOnChain
 * @notice ERC-721 collection whose JSON metadata and SVG image are embedded
 *         directly in each token's data URI.
 * @dev Public wallets may mint once each. The owner may also mint to an
 *      address. Both paths share the same hard cap of 42 tokens.
 */
contract TokenizeArtOnChain is ERC721, Ownable {
    using Strings for uint256;

    /// @notice Maximum number of NFTs in this collection.
    uint256 public constant MAX_SUPPLY = 42;

    /// @notice Artist name included in every on-chain metadata document.
    string public artist;

    /// @dev Number of successfully minted NFTs, also used for the next id.
    uint256 private _totalMinted;

    /// @notice Records whether an address used its one public mint.
    mapping(address wallet => bool minted) public hasPublicMinted;

    /// @notice Emitted when an on-chain art token is created.
    event ArtMinted(uint256 indexed tokenId, address indexed to, bool publicMint);

    /**
     * @notice Creates the on-chain version of the collection.
     * @param collectionName ERC-721 collection name.
     * @param collectionSymbol ERC-721 ticker symbol.
     * @param artistName Artist name embedded in token metadata.
     */
    constructor(
        string memory collectionName,
        string memory collectionSymbol,
        string memory artistName
    ) ERC721(collectionName, collectionSymbol) Ownable(msg.sender) {
        require(bytes(artistName).length > 0, "TokenizeArtOnChain: empty artist");
        artist = artistName;
    }

    /** @notice Mints one token to the caller, once per wallet. */
    function publicMint() external returns (uint256 tokenId) {
        require(!hasPublicMinted[msg.sender], "TokenizeArtOnChain: wallet already minted");
        hasPublicMinted[msg.sender] = true;
        tokenId = _mintArt(msg.sender, true);
    }

    /** @notice Allows the collection owner to mint one token to `to`. */
    function ownerMint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = _mintArt(to, false);
    }

    /** @notice Returns how many NFTs have been created. */
    function totalMinted() external view returns (uint256) {
        return _totalMinted;
    }

    /**
     * @notice Returns JSON metadata with an embedded SVG image as a data URI.
     * @param tokenId Existing token id.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId); // Revert for a token that has not been minted.

        string memory image = string.concat(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(_buildSvg(tokenId)))
        );
        string memory json = string.concat(
            "{\"name\":\"42 Neon Eagle #",
            tokenId.toString(),
            "\",\"description\":\"A geometric 42 Neon Eagle NFT by ",
            _escapeJson(artist),
            ". The metadata and SVG image are stored on-chain.\",\"artist\":\"",
            _escapeJson(artist),
            "\",\"attributes\":[{\"trait_type\":\"Artist\",\"value\":\"",
            _escapeJson(artist),
            "\"},{\"trait_type\":\"Collection\",\"value\":\"TokenizeArt 42 On-Chain\"}],\"image\":\"",
            image,
            "\"}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _mintArt(address to, bool isPublicMint) private returns (uint256 tokenId) {
        require(to != address(0), "TokenizeArtOnChain: mint to zero address");
        require(_totalMinted < MAX_SUPPLY, "TokenizeArtOnChain: maximum supply reached");

        tokenId = _totalMinted + 1;
        _totalMinted = tokenId;
        _mint(to, tokenId);
        ERC721Utils.checkOnERC721Received(_msgSender(), address(0), to, tokenId, "");

        emit ArtMinted(tokenId, to, isPublicMint);
    }

    /**
     * @dev Builds compact SVG art with a deterministic per-token palette.
     *      Both digits are vector paths; no font or remote image is required.
     */
    function _buildSvg(uint256 tokenId) private pure returns (string memory) {
        uint256 palette = tokenId % 3;
        string memory accent = palette == 0 ? "#ff8d68" : palette == 1 ? "#50eee2" : "#c28aff";
        string memory secondAccent = palette == 0 ? "#65a0ff" : palette == 1 ? "#b674ff" : "#ffd56c";

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
            '<defs><radialGradient id="g"><stop stop-color="#29204e"/><stop offset="1" stop-color="#071126"/></radialGradient></defs>',
            '<rect width="512" height="512" rx="36" fill="url(#g)"/>',
            '<circle cx="256" cy="250" r="204" fill="none" stroke="', accent, '" stroke-opacity=".35" stroke-width="3"/>',
            '<path d="M244 142 200 96 58 78l91 77-93-16 97 76-74 3 108 48 57-73Zm24 0 44-46 142-18-91 77 93-16-97 76 74 3-108 48-57-73Z" fill="', secondAccent, '"/>',
            '<path d="M256 119 283 147 256 177 229 147Z" fill="#effaff"/>',
            '<path d="M181 245v-70l120 170v86M155 345h162" fill="none" stroke="#071126" stroke-width="47" stroke-linejoin="round"/>',
            '<path d="M181 245v-70l120 170v86M155 345h162" fill="none" stroke="', accent, '" stroke-width="34" stroke-linejoin="round"/>',
            '<path d="M181 245v-70l120 170v86M155 345h162" fill="none" stroke="#f4fbff" stroke-width="23" stroke-linejoin="round"/>',
            '<path d="M337 211q13-36 53-36 46 0 46 40 0 24-23 46l-83 84h109" fill="none" stroke="#071126" stroke-width="47" stroke-linejoin="round"/>',
            '<path d="M337 211q13-36 53-36 46 0 46 40 0 24-23 46l-83 84h109" fill="none" stroke="', secondAccent, '" stroke-width="34" stroke-linejoin="round"/>',
            '<path d="M337 211q13-36 53-36 46 0 46 40 0 24-23 46l-83 84h109" fill="none" stroke="#f4fbff" stroke-width="23" stroke-linejoin="round"/>',
            '<path d="M200 437h112" stroke="#a7b7ff" stroke-opacity=".7" stroke-width="3"/>',
            '<circle cx="86" cy="256" r="4" fill="', accent, '"/><circle cx="426" cy="256" r="4" fill="', secondAccent, '"/>',
            '</svg>'
        );
    }

    /** @dev Escapes characters that have special meaning inside JSON strings. */
    function _escapeJson(string memory value) private pure returns (string memory) {
        bytes memory input = bytes(value);
        bytes memory escaped = new bytes(input.length * 6);
        uint256 outputLength;

        for (uint256 i; i < input.length; ++i) {
            bytes1 character = input[i];
            if (character == 0x22 || character == 0x5c) {
                escaped[outputLength++] = 0x5c;
                escaped[outputLength++] = character;
            } else if (uint8(character) < 0x20) {
                escaped[outputLength++] = 0x5c;
                escaped[outputLength++] = 0x75;
                escaped[outputLength++] = 0x30;
                escaped[outputLength++] = 0x30;
                escaped[outputLength++] = bytes1(_hexDigit(uint8(character) >> 4));
                escaped[outputLength++] = bytes1(_hexDigit(uint8(character) & 0x0f));
            } else {
                escaped[outputLength++] = character;
            }
        }

        bytes memory result = new bytes(outputLength);
        for (uint256 i; i < outputLength; ++i) result[i] = escaped[i];
        return string(result);
    }

    function _hexDigit(uint256 value) private pure returns (uint8) {
        return uint8(value < 10 ? 48 + value : 87 + value);
    }
}
