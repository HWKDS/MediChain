// Local deployment script for MediChain
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Path to compiled contract
const contractPath = path.join(__dirname, '../build/contracts/MediChain.json');

async function main() {
  try {
    console.log('Starting local deployment for MediChain...');
    
    // Check if contract is compiled
    if (!fs.existsSync(contractPath)) {
      console.error('Contract not compiled. Please run "npx truffle compile" first.');
      process.exit(1);
    }
    
    // Connect to local ganache - use 127.0.0.1 instead of localhost to avoid IPv6 issues
    const web3 = new Web3('http://127.0.0.1:8545');
    console.log('Connected to local Ganache instance at http://127.0.0.1:8545');
    
    // Test connection
    try {
      await web3.eth.getBlockNumber();
    } catch (connError) {
      console.error('Failed to connect to Ganache:', connError.message);
      console.error('Make sure Ganache is running on 127.0.0.1:8545');
      process.exit(1);
    }
    
    // Load contract JSON
    const contractJson = require(contractPath);
    
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      console.error('No accounts found. Make sure Ganache is running.');
      process.exit(1);
    }
    
    const deployer = accounts[0];
    console.log(`Deploying from account: ${deployer}`);
    console.log(`Account balance: ${web3.utils.fromWei(await web3.eth.getBalance(deployer), 'ether')} ETH`);
    
    // Create contract instance
    const MediChain = new web3.eth.Contract(contractJson.abi);
    
    // Deploy contract
    console.log('Deploying MediChain contract...');
    const deployTx = MediChain.deploy({
      data: contractJson.bytecode
    });
    
    // Estimate gas
    const gas = await deployTx.estimateGas({ from: deployer });
    console.log(`Estimated gas: ${gas}`);
    
    // Convert gas buffer to number to avoid BigInt issues
    const gasLimit = Number(gas) * 1.1;
    
    // Send deploy transaction
    const deployedContract = await deployTx.send({
      from: deployer,
      gas: Math.floor(gasLimit) // Convert back to integer
    });
    
    const contractAddress = deployedContract.options.address;
    console.log(`Contract deployed successfully at: ${contractAddress}`);
    
    // Update .env file with the contract address
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
      fs.writeFileSync(envPath, envContent);
      console.log('Updated .env file with contract address');
    }
    
    // Update backend .env file if it exists
    const backendEnvPath = path.join(__dirname, '../medichain-backend/.env');
    if (fs.existsSync(backendEnvPath)) {
      let backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
      backendEnvContent = backendEnvContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
      fs.writeFileSync(backendEnvPath, backendEnvContent);
      console.log('Updated backend .env file with contract address');
    }
    
    // Register a test drug
    console.log('Setting up test data...');
    
    try {
      // First authorize the deployer as a manufacturer
      await deployedContract.methods.setManufacturerStatus(deployer, true)
        .send({ 
          from: deployer,
          gas: 200000 // Explicitly set gas limit
        });
      console.log(`Account ${deployer} authorized as manufacturer`);
      
      // Register a test drug with higher gas limit
      const now = Math.floor(Date.now() / 1000);
      const oneYearFromNow = now + (365 * 24 * 60 * 60);
      
      console.log('Registering test drug...');
      const registerTx = await deployedContract.methods.registerDrug(
        'MED-12345',
        'TestDrug',
        'PharmaCo',
        'BATCH001',
        now,
        oneYearFromNow,
        'Active ingredients, excipients'
      ).send({ 
        from: deployer, 
        gas: 500000 // Higher gas limit for complex function
      });
      
      console.log(`Test drug registered with QR code: MED-12345 (tx: ${registerTx.transactionHash})`);
    } catch (error) {
      console.error('Error setting up test data:', error.message);
      console.log('Contract was deployed, but test data setup failed.');
      console.log('You can manually register drugs using the API once the server is running.');
    }
    
    console.log('Deployment complete!');
    
    console.log('\nQuick Start Guide:');
    console.log('1. Start backend: cd medichain-backend && node server.js');
    console.log('2. Start frontend: cd medichain-frontend && npm start');
    console.log('3. Use QR code "MED-12345" for testing (if registration succeeded)');
    
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run the script
main();