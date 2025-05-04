const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Web3 } = require('web3');
const contractABI = require('./contractABI.json');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Enhanced CORS configuration for GitHub Pages
app.use(cors({
  // Allow requests from any origin when developing
  // In production, you might want to restrict this to your GitHub Pages domain
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Web3 configuration - using local blockchain
const web3 = new Web3('http://127.0.0.1:8545'); // Local Ganache using IPv4 address
const contractAddress = process.env.CONTRACT_ADDRESS;

// Check if contract address is available
if (!contractAddress) {
  console.error('CONTRACT_ADDRESS not set in .env file. Please deploy the contract first.');
  console.error('Run "node scripts/deploy_local.js" to deploy the contract.');
  process.exit(1);
}

const mediChainContract = new web3.eth.Contract(contractABI, contractAddress);

console.log(`Connected to local blockchain at http://localhost:8545`);
console.log(`Using contract at address: ${contractAddress}`);

// Get account to use for transactions
let defaultAccount = null;

// Initialize Web3 and get default account
async function initWeb3() {
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      console.error('No accounts found. Make sure Ganache is running.');
      process.exit(1);
    }
    defaultAccount = accounts[0];
    console.log(`Using account: ${defaultAccount}`);
    console.log(`Account balance: ${web3.utils.fromWei(await web3.eth.getBalance(defaultAccount), 'ether')} ETH`);
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    process.exit(1);
  }
}

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'MediChain API is working!',
    contractAddress,
    defaultAccount
  });
});

// Verify a drug using QR code - completely rewritten to avoid event dependency
app.post('/api/verify', async (req, res) => {
  try {
    const { qrCode, location } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }
    
    console.log(`Verifying drug with QR code: ${qrCode}`);
    
    // Check if drug exists in the blockchain
    let drugExists = false;
    let drugDetails = null;
    
    try {
      // Get drug details
      const details = await mediChainContract.methods.drugs(qrCode).call();
      drugExists = details.isRegistered;
      
      if (drugExists) {
        // Get full details if drug exists
        drugDetails = {
          name: details.name,
          manufacturer: details.manufacturer,
          batchNumber: details.batchNumber,
          manufactureDate: parseInt(details.manufactureDate),
          expiryDate: parseInt(details.expiryDate),
          ingredients: details.ingredients
        };
      }
    } catch (error) {
      console.log(`Error checking drug existence: ${error.message}`);
      drugExists = false;
    }
    
    // Get current scan count
    let currentScanCount = 0;
    try {
      currentScanCount = parseInt(await mediChainContract.methods.scanCounts(qrCode).call());
    } catch (error) {
      console.log(`Error getting scan count: ${error.message}`);
    }
    
    // Record the verification (this will increase the scan count)
    try {
      await mediChainContract.methods.verifyDrug(qrCode, location || 'Web Client')
        .send({ from: defaultAccount, gas: 200000 });
      
      // Get updated scan count after verification
      currentScanCount = parseInt(await mediChainContract.methods.scanCounts(qrCode).call());
    } catch (error) {
      console.log(`Error recording verification: ${error.message}`);
      // Continue processing even if verification recording fails
    }
    
    // Check if drug is suspicious (more than 2 scans)
    const isSuspicious = currentScanCount > 2;
    
    // Send response
    res.json({
      isAuthentic: drugExists,
      scanCount: currentScanCount,
      isSuspicious: isSuspicious,
      drugDetails: drugExists ? {
        name: drugDetails.name,
        manufacturer: drugDetails.manufacturer,
        batchNumber: drugDetails.batchNumber,
        expiryDate: new Date(drugDetails.expiryDate * 1000).toISOString(),
        ingredients: drugDetails.ingredients
      } : null
    });
    
  } catch (error) {
    console.error('Error in verification process:', error);
    res.status(500).json({ 
      error: 'Error verifying drug', 
      message: error.message 
    });
  }
});

// Register a new drug (only for authorized manufacturers)
app.post('/api/register', async (req, res) => {
  try {
    const { 
      qrCode, name, manufacturer, batchNumber, 
      manufactureDate, expiryDate, ingredients
    } = req.body;
    
    console.log('Received registration request for:', { qrCode, name, manufacturer, batchNumber });
    
    if (!qrCode || !name || !manufacturer || !batchNumber || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if manufacturer is authorized
    try {
      const isAuthorized = await mediChainContract.methods.authorizedManufacturers(defaultAccount).call();
      console.log(`Manufacturer authorization status for ${defaultAccount}: ${isAuthorized}`);
      
      if (!isAuthorized) {
        console.log('Authorizing manufacturer before registration...');
        await mediChainContract.methods.setManufacturerStatus(defaultAccount, true)
          .send({ from: defaultAccount, gas: 200000 });
        console.log('Manufacturer authorized successfully');
      }
    } catch (authError) {
      console.error('Error checking manufacturer authorization:', authError);
    }
    
    // Convert dates to timestamps
    const manufactureTimestamp = Math.floor(new Date(manufactureDate).getTime() / 1000);
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    console.log('Timestamps:', {
      manufacture: manufactureTimestamp,
      expiry: expiryTimestamp,
      current: currentTimestamp
    });
    
    // Validate dates
    if (expiryTimestamp <= currentTimestamp) {
      return res.status(400).json({ 
        error: 'Invalid expiry date', 
        message: 'Expiry date must be in the future'
      });
    }
    
    // Check if drug already exists
    try {
      const existingDrug = await mediChainContract.methods.drugs(qrCode).call();
      if (existingDrug && existingDrug.isRegistered) {
        return res.status(400).json({
          error: 'Drug already registered',
          message: `A drug with QR code ${qrCode} is already registered`
        });
      }
    } catch (drugCheckError) {
      console.log('Drug does not exist yet, proceeding with registration.');
    }
    
    // Register the drug on the blockchain
    console.log('Registering drug with parameters:', {
      qrCode, name, manufacturer, batchNumber,
      manufactureTimestamp, expiryTimestamp, ingredients: ingredients || 'Not provided'
    });
    
    const result = await mediChainContract.methods
      .registerDrug(
        qrCode, 
        name, 
        manufacturer, 
        batchNumber, 
        manufactureTimestamp, 
        expiryTimestamp, 
        ingredients || 'Not provided'
      )
      .send({ from: defaultAccount, gas: 500000 }); // Increased gas limit
    
    console.log('Registration successful:', result.transactionHash);
    
    res.json({ 
      success: true, 
      transactionHash: result.transactionHash,
      message: `Drug ${name} registered successfully with QR code ${qrCode}`
    });
  } catch (error) {
    console.error('Error registering drug:', error);
    
    // Enhanced error handling
    let errorMessage = error.message;
    let isAuthError = error.message.includes('authorized');
    
    // Check specific revert reasons
    if (error.message.includes('already registered')) {
      errorMessage = 'This QR code is already registered for another drug';
    } else if (error.message.includes('future')) {
      errorMessage = 'The expiry date must be in the future';
    }
    
    res.status(500).json({ 
      error: 'Error registering drug', 
      message: errorMessage,
      isAuthError,
      transactionError: error.receipt ? true : false
    });
  }
});

// Get drug details
app.get('/api/drug/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    // Get drug details from blockchain
    const drugDetails = await mediChainContract.methods.getDrugDetails(qrCode).call();
    
    // Get scan count
    const scanCount = await mediChainContract.methods.getScanCount(qrCode).call();
    
    // Check if suspicious
    const suspiciousCheck = await mediChainContract.methods.checkIfSuspicious(qrCode).call();
    
    res.json({
      name: drugDetails.name,
      manufacturer: drugDetails.manufacturer,
      batchNumber: drugDetails.batchNumber,
      expiryDate: new Date(drugDetails.expiryDate * 1000).toISOString(),
      ingredients: drugDetails.ingredients,
      scanCount: parseInt(scanCount),
      isSuspicious: suspiciousCheck.isSuspicious === 'true' || suspiciousCheck.isSuspicious === true
    });
  } catch (error) {
    console.error('Error getting drug details:', error);
    if (error.message.includes('not registered')) {
      res.status(404).json({ error: 'Drug not found', message: 'No drug registered with this QR code' });
    } else {
      res.status(500).json({ error: 'Error getting drug details', message: error.message });
    }
  }
});

// Start server
async function startServer() {
  await initWeb3();
  
  app.listen(port, () => {
    console.log(`MediChain API server running on port ${port}`);
    console.log(`Test API at: http://localhost:${port}/api/test`);
  });
}

startServer();