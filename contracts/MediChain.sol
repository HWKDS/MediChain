// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MediChain
 * @dev Smart contract for drug authenticity verification using blockchain
 */
contract MediChain {
    // Structure to store drug information
    struct Drug {
        string name;
        string manufacturer;
        string batchNumber;
        uint256 manufactureDate;
        uint256 expiryDate;
        string ingredients;
        bool isRegistered;
    }

    // Structure to store scan history
    struct ScanHistory {
        address scanner;
        uint256 timestamp;
        string location;
    }

    // Drug QR code mapping to drug details
    mapping(string => Drug) public drugs;
    
    // QR code mapping to scan count
    mapping(string => uint256) public scanCounts;
    
    // QR code mapping to scan history
    mapping(string => ScanHistory[]) public scanHistories;
    
    // Addresses authorized to register drugs (manufacturers)
    mapping(address => bool) public authorizedManufacturers;
    
    // Contract owner
    address public owner;
    
    // Events
    event DrugRegistered(string qrCode, string name, string manufacturer, string batchNumber, uint256 expiryDate);
    event DrugVerified(string qrCode, address verifier, bool isAuthentic, uint256 scanCount);
    event ManufacturerAuthorized(address manufacturer, bool status);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorizedManufacturer() {
        require(authorizedManufacturers[msg.sender], "Only authorized manufacturers can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Authorize or revoke a manufacturer
     * @param manufacturer Address of the manufacturer
     * @param status Authorization status
     */
    function setManufacturerStatus(address manufacturer, bool status) external onlyOwner {
        authorizedManufacturers[manufacturer] = status;
        emit ManufacturerAuthorized(manufacturer, status);
    }
    
    /**
     * @dev Register a new drug with unique QR code
     * @param qrCode Unique QR code of the drug
     * @param name Name of the drug
     * @param manufacturer Name of the manufacturer
     * @param batchNumber Batch number of the drug
     * @param manufactureDate Manufacture date as timestamp
     * @param expiryDate Expiry date as timestamp
     * @param ingredients Ingredients of the drug
     */
    function registerDrug(
        string memory qrCode,
        string memory name,
        string memory manufacturer,
        string memory batchNumber,
        uint256 manufactureDate,
        uint256 expiryDate,
        string memory ingredients
    ) external onlyAuthorizedManufacturer {
        require(!drugs[qrCode].isRegistered, "Drug with this QR code already registered");
        require(expiryDate > block.timestamp, "Expiry date must be in the future");
        
        Drug memory newDrug = Drug({
            name: name,
            manufacturer: manufacturer,
            batchNumber: batchNumber,
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            ingredients: ingredients,
            isRegistered: true
        });
        
        drugs[qrCode] = newDrug;
        
        emit DrugRegistered(qrCode, name, manufacturer, batchNumber, expiryDate);
    }
    
    /**
     * @dev Verify a drug using its QR code
     * @param qrCode QR code of the drug
     * @param location Location where the drug is being verified
     * @return isAuthentic Whether the drug is authentic
     * @return scanCount Number of times this QR code has been scanned
     */
    function verifyDrug(string memory qrCode, string memory location) external returns (bool isAuthentic, uint256 scanCount) {
        // Check if drug is registered
        isAuthentic = drugs[qrCode].isRegistered;
        
        // Update scan count
        scanCounts[qrCode]++;
        scanCount = scanCounts[qrCode];
        
        // Record scan history
        ScanHistory memory scan = ScanHistory({
            scanner: msg.sender,
            timestamp: block.timestamp,
            location: location
        });
        
        scanHistories[qrCode].push(scan);
        
        emit DrugVerified(qrCode, msg.sender, isAuthentic, scanCount);
        
        return (isAuthentic, scanCount);
    }
    
    /**
     * @dev Get drug details by QR code
     * @param qrCode QR code of the drug
     * @return name Name of the drug
     * @return manufacturer Manufacturer of the drug
     * @return batchNumber Batch number of the drug
     * @return expiryDate Expiry date of the drug
     * @return ingredients Ingredients of the drug
     */
    function getDrugDetails(string memory qrCode) external view returns (
        string memory name,
        string memory manufacturer,
        string memory batchNumber,
        uint256 expiryDate,
        string memory ingredients
    ) {
        require(drugs[qrCode].isRegistered, "Drug not registered");
        
        Drug memory drug = drugs[qrCode];
        return (
            drug.name,
            drug.manufacturer,
            drug.batchNumber,
            drug.expiryDate,
            drug.ingredients
        );
    }
    
    /**
     * @dev Get scan count for a specific QR code
     * @param qrCode QR code of the drug
     * @return Number of times the QR code has been scanned
     */
    function getScanCount(string memory qrCode) external view returns (uint256) {
        return scanCounts[qrCode];
    }
    
    /**
     * @dev Check if a drug is suspicious based on scan count
     * @param qrCode QR code of the drug
     * @return isSuspicious Whether the drug is suspicious
     * @return scanCount Number of times the QR code has been scanned
     */
    function checkIfSuspicious(string memory qrCode) external view returns (bool isSuspicious, uint256 scanCount) {
        scanCount = scanCounts[qrCode];
        
        // If the drug has been scanned multiple times, it might be suspicious
        // This is a simplified logic; in a real-world scenario, more complex rules would apply
        isSuspicious = scanCount > 2;
        
        return (isSuspicious, scanCount);
    }
}