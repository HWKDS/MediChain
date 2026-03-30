# MediChain

MediChain is a blockchain-powered drug authenticity verification system that helps combat counterfeit medicines using Ethereum blockchain technology.

## Overview

MediChain allows patients and pharmacies to verify medicines through a unique QR code printed on each package. The system uses smart contracts to track each drug's information and verification history.

### Key Features

- **QR Code Verification**: Scan medicine QR codes to instantly verify authenticity
- **Blockchain Security**: All drug data is stored securely on the blockchain
- **Counterfeit Detection**: Alert system identifies suspicious verification patterns
- **Trustless Verification**: No need to trust a central authority

## Local Development Setup

This guide helps you set up MediChain locally without requiring any external blockchain providers or wallets.

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/HWKDS/MediChain.git
cd MediChain

# Install project dependencies
npm install

# Install Ganache for local blockchain
npm install -g ganache
```

### Deploy to Local Blockchain

1. Start a local blockchain using Ganache:

```bash
# Run Ganache with deterministic addresses
ganache --deterministic
```

2. In a new terminal, compile and deploy the smart contract:

```bash
# Compile the contracts
npx truffle compile

# Deploy using the local script
node scripts/deploy_local.js
```

The deployment script will:
- Deploy the MediChain contract to your local blockchain
- Register a test manufacturer
- Add a test drug with QR code "MED-12345"
- Update the `.env` files with the contract address

### Start the Backend Server

```bash
cd medichain-backend

# Install dependencies (if not done already)
npm install

# Start the server
node server.js
```

The server will connect to the local blockchain and use the first Ganache account for transactions.

### Start the Frontend Application

```bash
cd medichain-frontend

# Install dependencies (if not done already)
npm install

# Start the development server
npm start
```

The application should open in your browser at http://localhost:3000

## Testing the Application

1. **Verify the test drug**:
   - Enter "MED-12345" in the verification field, or
   - Generate a QR code with text "MED-12345" and scan it using the app's scanner

2. **Register additional drugs** using the API:
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "MED-67890",
    "name": "AnotherDrug",
    "manufacturer": "OtherPharma",
    "batchNumber": "BATCH002",
    "manufactureDate": "2023-01-01",
    "expiryDate": "2025-01-01",
    "ingredients": "Active ingredients, excipients"
  }'
```

## Architecture

MediChain consists of three main components:

1. **Smart Contract**: Stores drug information and handles verification logic
2. **Backend API**: Acts as a bridge between the frontend and blockchain
3. **Frontend UI**: User interface for scanning QR codes and displaying verification results

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined" errors**:
   - Ensure Ganache is running with `--deterministic` flag
   - Check that the contract address in `.env` files matches the deployed contract

2. **Transaction reverted errors**:
   - Increase gas limit for complex transactions (usually 500,000 is sufficient)
   - Make sure you're using the authorized manufacturer account

3. **QR scanner not working**:
   - Ensure you've granted camera permissions
   - Use a well-lit QR code
   - Try entering the code manually if scanning fails

### Restarting the Project

If you encounter persistent issues, try these steps:

1. Restart Ganache with a clean state:
   ```bash
   ganache --deterministic --clear
   ```

2. Redeploy the contract:
   ```bash
   node scripts/deploy_local.js
   ```

3. Restart the backend and frontend servers

## Project Structure

- `/contracts`: Solidity smart contracts
- `/migrations`: Truffle migration scripts
- `/medichain-frontend`: React frontend application
- `/medichain-backend`: Express.js backend API
- `/scripts`: Deployment and utility scripts

## Future Enhancements

- Mobile application for easier verification
- Integration with pharmaceutical supply chain systems
- Multi-factor authentication for manufacturers
- Analytics dashboard for monitoring drug verifications
