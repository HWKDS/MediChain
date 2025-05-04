import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

const QRCodeScanner = ({ onScanSuccess }) => {
  const [error, setError] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = (result) => {
    if (result && !hasScanned) {
      // Set flag to prevent multiple scans of the same code
      setHasScanned(true);
      onScanSuccess(result?.text);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError('Error accessing camera. Please ensure camera permissions are granted.');
  };

  return (
    <div className="qr-scanner-container">
      <h3>Scan Medicine QR Code</h3>
      {error && <p className="error-message">{error}</p>}
      <div className="scanner-wrapper">
        <QrReader
          constraints={{ facingMode: 'environment' }}
          onResult={handleScan}
          videoStyle={{ width: '100%', maxWidth: '300px' }}
          scanDelay={500}
        />
      </div>
      <p className="scanner-instruction">
        Position the QR code in the center of the frame
      </p>
    </div>
  );
};

export default QRCodeScanner;