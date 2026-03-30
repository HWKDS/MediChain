// deploy.js - A custom script for more reliable deployments
require('dotenv').config();
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const path = require('path');

// Contract artifacts
const MediChainJson = require('../build/contracts/MediChain.json');

// Max retries and delay
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// Helper function to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function deployWithRetry(provider, networkId) {
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  
  console.log(`Deploying from account: ${deployer}`);
  console.log(`Account balance: ${web3.utils.fromWei(await web3.eth.getBalance(deployer), 'ether')} ETH`);
  
  const MediChain = new web3.eth.Contract(MediChainJson.abi);
  
  console.log('Deploying MediChain contract...');
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const deployTx = MediChain.deploy({
        data: MediChainJson.bytecode,
      });
      
      const gas = await deployTx.estimateGas({ from: deployer });
      console.log(`Estimated gas: ${gas}`);
      
      const deployOptions = {
        from: deployer,
        gas: Math.min(6000000, Math.floor(gas * 1.2)), // Add 20% buffer, but cap at 6M
        gasPrice: await web3.eth.getGasPrice()
      };
      
      console.log(`Attempt ${attempt}/${MAX_RETRIES} - Deploying with options:`, deployOptions);
      
      const deployedContract = await deployTx.send(deployOptions)
        .on('transactionHash', (hash) => {
          console.log(`Transaction hash: ${hash}`);
          console.log('Waiting for confirmation (this may take a few minutes)...');
        });
      
      const contractAddress = deployedContract.options.address;
      console.log(`Contract deployed successfully at: ${contractAddress}`);
      
      // Update .env file with the contract address
      let envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
      fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
      
      // Also update backend .env file if it exists
      const backendEnvPath = path.join(__dirname, '../medichain-backend/.env');
      if (fs.existsSync(backendEnvPath)) {
        let backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
        backendEnvContent = backendEnvContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
        fs.writeFileSync(backendEnvPath, backendEnvContent);
      }
      
      console.log('Contract address saved to .env file(s)');
      return contractAddress;
    } catch (error) {
      console.error(`Deployment attempt ${attempt} failed:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt; // Exponential backoff
        console.log(`Retrying in ${delay/1000} seconds...`);
        await sleep(delay);
      } else {
        console.error('Max retries reached. Deployment failed.');
        throw error;
      }
    }
  }
}

async function main() {
  try {
    // Load configuration
    const networkName = process.env.ETHEREUM_NETWORK || 'development';
    const infuraApiKey = process.env.INFURA_API_KEY;
    const mnemonic = process.env.MNEMONIC;
    
    console.log(`Deploying to ${networkName} network`);
    
    let provider;
    
    // Set up provider based on network
    if (networkName === 'development') {
      provider = new Web3.providers.HttpProvider('http://localhost:8545');
      console.log('Using local development network at http://localhost:8545');
    } else {
      // Check configuration
      if (!infuraApiKey || infuraApiKey === 'your_infura_api_key_here') {
        throw new Error('Please set your INFURA_API_KEY in the .env file');
      }
      
      if (!mnemonic || mnemonic === 'test test test test test test test test test test test junk') {
        console.warn('Warning: Using default mnemonic. Use only for testing.');
      }
      
      let providerUrl;
      let networkId;
      
      switch(networkName) {
        case 'sepolia':
          providerUrl = `https://sepolia.infura.io/v3/${infuraApiKey}`;
          networkId = 11155111;
          break;
        case 'goerli':
          providerUrl = `https://goerli.infura.io/v3/${infuraApiKey}`;
          networkId = 5;
          break;
        case 'mainnet':
          providerUrl = `https://mainnet.infura.io/v3/${infuraApiKey}`;
          networkId = 1;
          break;
        default:
          throw new Error(`Unsupported network: ${networkName}`);
      }
      
      console.log(`Using Infura provider at ${providerUrl.replace(infuraApiKey, '***')}`);
      
      provider = new HDWalletProvider({
        mnemonic: {
          phrase: mnemonic
        },
        providerOrUrl: providerUrl,
        numberOfAddresses: 1,
        shareNonce: true,
        pollingInterval: 8000 // Reduce polling frequency to avoid rate limiting
      });
      
      // Deploy the contract with retry logic
      await deployWithRetry(provider, networkId);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run the script
main();