// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CertificateRegistry
 * @dev A smart contract for issuing, verifying, and managing digital certificates on the blockchain.
 * 
 * Concept Explanation:
 * - Admin: The deployer of this contract (like a super-user/authority) who can grant or revoke issuer permissions.
 * - Authorized Issuers: Addresses approved by the admin (like universities, government officers, or organizations)
 *   that are allowed to mint/issue new certificates.
 * - Certificates: Stored permanently on the blockchain with a unique ID and a cryptographic hash (fingerprint) of the document.
 */
contract CertificateRegistry {
    // The admin of the contract (the deployer) who manages authorized issuers.
    address public admin;

    // Structure defining all fields stored for a single certificate.
    struct Certificate {
        bytes32 documentHash; // Cryptographic hash (fingerprint) of the certificate document
        address issuer;       // Wallet address of the authorized issuer who created this certificate
        uint256 issueDate;    // Timestamp (Unix epoch in seconds) when the certificate was issued on-chain
        bool exists;          // Boolean flag indicating if this certificate ID has been registered
    }

    // Mapping from a certificate ID (string) to its corresponding Certificate data.
    mapping(string => Certificate) private certificates;

    // Mapping to track which wallet addresses are authorized to issue certificates.
    mapping(address => bool) public isAuthorizedIssuer;

    // Event emitted whenever a new certificate is successfully issued.
    // Off-chain systems (e.g. web frontends or notification systems) can listen for this event.
    event CertificateIssued(
        string certificateId,
        bytes32 documentHash,
        address indexed issuer,
        uint256 issueDate
    );

    // Event emitted when an issuer's authorization status changes.
    event IssuerStatusChanged(address indexed issuer, bool isAuthorized);

    // Modifier restricting execution of a function to only the contract admin.
    modifier onlyAdmin() {
        require(msg.sender == admin, "CertificateRegistry: Only admin can call this function");
        _;
    }

    // Modifier restricting execution of a function to only authorized issuers.
    modifier onlyAuthorizedIssuer() {
        require(
            isAuthorizedIssuer[msg.sender],
            "CertificateRegistry: Only authorized issuers can call this function"
        );
        _;
    }

    /**
     * @notice Contract constructor.
     * @dev Sets the contract deployer (msg.sender) as the admin and automatically authorizes them as an issuer.
     */
    constructor() {
        admin = msg.sender;
        isAuthorizedIssuer[msg.sender] = true;
        emit IssuerStatusChanged(msg.sender, true);
    }

    /**
     * @notice Authorizes a wallet address to issue certificates.
     * @dev Only callable by the contract admin.
     * @param _issuer The wallet address to grant issuing permissions to.
     */
    function authorizeIssuer(address _issuer) external onlyAdmin {
        require(_issuer != address(0), "CertificateRegistry: Invalid address");
        require(!isAuthorizedIssuer[_issuer], "CertificateRegistry: Address is already authorized");
        
        isAuthorizedIssuer[_issuer] = true;
        emit IssuerStatusChanged(_issuer, true);
    }

    /**
     * @notice Revokes certificate issuing authorization from a wallet address.
     * @dev Only callable by the contract admin.
     * @param _issuer The wallet address to revoke permissions from.
     */
    function revokeIssuer(address _issuer) external onlyAdmin {
        require(isAuthorizedIssuer[_issuer], "CertificateRegistry: Address is not an authorized issuer");
        
        isAuthorizedIssuer[_issuer] = false;
        emit IssuerStatusChanged(_issuer, false);
    }

    /**
     * @notice Issues a new certificate and records it on the blockchain.
     * @dev Only callable by authorized issuers. Fails if the certificateId already exists.
     * @param certificateId Unique string identifier for the certificate (e.g., "CERT-2026-001").
     * @param documentHash 32-byte cryptographic hash of the certificate document.
     */
    function issueCertificate(string memory certificateId, bytes32 documentHash) external onlyAuthorizedIssuer {
        require(bytes(certificateId).length > 0, "CertificateRegistry: Certificate ID cannot be empty");
        require(documentHash != bytes32(0), "CertificateRegistry: Document hash cannot be empty");
        require(!certificates[certificateId].exists, "CertificateRegistry: Certificate ID already exists");

        // Save certificate in smart contract storage
        certificates[certificateId] = Certificate({
            documentHash: documentHash,
            issuer: msg.sender,
            issueDate: block.timestamp,
            exists: true
        });

        // Log the event on the blockchain
        emit CertificateIssued(certificateId, documentHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Public view function to verify whether a given document hash matches the stored certificate.
     * @dev Anyone can call this function. Returns false if certificate does not exist or hash does not match.
     * @param certificateId Unique string identifier of the certificate to verify.
     * @param documentHash 32-byte hash of the document to check against the blockchain record.
     * @return true if the certificate exists and the document hash matches; false otherwise.
     */
    function verifyCertificate(string memory certificateId, bytes32 documentHash) external view returns (bool) {
        Certificate memory cert = certificates[certificateId];
        if (!cert.exists) {
            return false;
        }
        return cert.documentHash == documentHash;
    }

    /**
     * @notice Public view function to retrieve all stored details of a certificate.
     * @dev Anyone can call this function to inspect certificate data.
     * @param certificateId Unique string identifier of the certificate.
     * @return documentHash The 32-byte hash of the document.
     * @return issuer The address of the issuer who created the certificate.
     * @return issueDate The block timestamp (Unix epoch in seconds) when issued.
     * @return exists Boolean flag indicating whether the certificate exists.
     */
    function getCertificate(string memory certificateId)
        external
        view
        returns (
            bytes32 documentHash,
            address issuer,
            uint256 issueDate,
            bool exists
        )
    {
        Certificate memory cert = certificates[certificateId];
        return (cert.documentHash, cert.issuer, cert.issueDate, cert.exists);
    }
}
