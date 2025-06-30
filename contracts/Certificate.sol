// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Certificate is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct CertificateData {
        string name;
        uint256 readingScore;
        uint256 listeningScore;
        uint256 issueDate;
        uint256 expirationDate;
        string nationalID;
        string cidCertificate;
    }

    mapping(uint256 => CertificateData) private _certificates;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        uint256 readingScore,
        uint256 listeningScore,
        uint256 issueDate,
        uint256 expirationDate,
        string nationalID,
        string cidCertificate
    );

    constructor() ERC721("Certificate", "CERT") Ownable(msg.sender) {}

    function mintCertificate(
        address to,
        string memory name,
        uint256 readingScore,
        uint256 listeningScore,
        uint256 issueDate,
        uint256 expirationDate,
        string memory nationalID,
        string memory cidCertificate
    ) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(nationalID).length > 0, "National ID cannot be empty");
        require(bytes(cidCertificate).length > 0, "CID cannot be empty");
        require(
            issueDate <= expirationDate,
            "Expiration date must be after issue date"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _certificates[tokenId] = CertificateData({
            name: name,
            readingScore: readingScore,
            listeningScore: listeningScore,
            issueDate: issueDate,
            expirationDate: expirationDate,
            nationalID: nationalID,
            cidCertificate: cidCertificate
        });

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, cidCertificate);

        emit CertificateMinted(
            tokenId,
            to,
            name,
            readingScore,
            listeningScore,
            issueDate,
            expirationDate,
            nationalID,
            cidCertificate
        );
    }

    function getCertificateDetails(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory name,
            uint256 readingScore,
            uint256 listeningScore,
            uint256 issueDate,
            uint256 expirationDate,
            string memory nationalID,
            string memory cidCertificate
        )
    {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        CertificateData memory cert = _certificates[tokenId];
        return (
            cert.name,
            cert.readingScore,
            cert.listeningScore,
            cert.issueDate,
            cert.expirationDate,
            cert.nationalID,
            cert.cidCertificate
        );
    }

    function isCertificateValid(uint256 tokenId) public view returns (bool) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return block.timestamp <= _certificates[tokenId].expirationDate;
    }

    function getAllTokens() public view returns (uint256[] memory) {
        uint256 total = _tokenIdCounter.current();
        uint256[] memory tokens = new uint256[](total);

        for (uint256 i = 0; i < total; i++) {
            tokens[i] = i;
        }

        return tokens;
    }
}
