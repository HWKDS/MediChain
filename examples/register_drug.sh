#!/bin/bash
# Example script for registering a drug in MediChain

# Register a drug with valid JSON format
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "example_qr_code_123",
    "name": "drug_name",
    "manufacturer": "manufacturer_name",
    "batchNumber": "batch_number_123",
    "manufactureDate": "2023-01-01",
    "expiryDate": "2025-11-01",
    "ingredients": "Active ingredients, excipients"
  }'

# Note: Make sure:
# 1. The manufacture date is in the past
# 2. The expiry date is in the future
# 3. The JSON is properly formatted with no syntax errors