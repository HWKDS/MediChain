require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Validate Infura API key
const infuraApiKey = process.env.INFURA_API_KEY;
const mnemonic = process.env.MNEMONIC;

if (!infuraApiKey || infuraApiKey === 'your_infura_api_key_here') {
  console.error('⚠️  Error: INFURA_API_KEY not properly set in .env file');
}

if (!mnemonic || mnemonic === 'test test test test test test test test test test test junk') {
  console.error('⚠️  Warning: Using default mnemonic. Real funds may be at risk.');
}

module.exports = {
  networks: {
    // For local development using Ganache
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    
    // For Sepolia Testnet (currently recommended for ETH testnet)
    sepolia: {
      provider: () => {
        if (!infuraApiKey || infuraApiKey === 'your_infura_api_key_here') {
          throw new Error('Please set your INFURA_API_KEY in the .env file');
        }
        return new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic
          },
          providerOrUrl: `https://sepolia.infura.io/v3/${infuraApiKey}`,
          numberOfAddresses: 1,
          shareNonce: true,
        });
      },
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 20000000000, // 20 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    
    // For Goerli Testnet (deprecated but still available)
    goerli: {
      provider: () => {
        if (!infuraApiKey || infuraApiKey === 'your_infura_api_key_here') {
          throw new Error('Please set your INFURA_API_KEY in the .env file');
        }
        return new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic
          },
          providerOrUrl: `https://goerli.infura.io/v3/${infuraApiKey}`,
          numberOfAddresses: 1,
          shareNonce: true,
        });
      },
      network_id: 5,
      gas: 5500000,
      gasPrice: 20000000000, // 20 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    
    // For Ethereum Mainnet (use only when ready for production)
    mainnet: {
      provider: () => {
        if (!infuraApiKey || infuraApiKey === 'your_infura_api_key_here') {
          throw new Error('Please set your INFURA_API_KEY in the .env file');
        }
        if (!mnemonic || mnemonic === 'test test test test test test test test test test test junk') {
          throw new Error('Do NOT use the default mnemonic on mainnet');
        }
        return new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic
          },
          providerOrUrl: `https://mainnet.infura.io/v3/${infuraApiKey}`,
          numberOfAddresses: 1,
          shareNonce: true,
        });
      },
      network_id: 1,
      gas: 5500000,
      gasPrice: 50000000000, // 50 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: false
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.17",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  
  // Paths for smart contracts
  contracts_directory: './contracts/',
  contracts_build_directory: './build/contracts/',
  migrations_directory: './migrations/',
};