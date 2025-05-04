import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import QRCodeScanner from './components/QRCodeScanner';
import config from './config';

function App() {
  const [qrCode, setQrCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({ isChecking: true, isAvailable: false, url: '' });
  
  // Use ref to track if verification is in progress
  const verificationInProgress = useRef(false);

  // Check API availability when component mounts
  useEffect(() => {
    const checkApiStatus = async () => {
      setApiStatus(prev => ({ ...prev, isChecking: true }));
      try {
        // Try to get the dynamic API URL from window.API_URL (set by ngrok script)
        const apiUrl = window.API_URL || config.apiUrl;
        console.log(`Checking API availability at: ${apiUrl}`);
        
        const response = await fetch(`${apiUrl}/test`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Set a short timeout to avoid long waiting when API is unavailable
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API is available:', data);
          setApiStatus({ 
            isChecking: false, 
            isAvailable: true, 
            url: apiUrl,
            contractAddress: data.contractAddress
          });
        } else {
          setApiStatus({ isChecking: false, isAvailable: false, url: apiUrl });
          console.error('API returned an error:', await response.text());
        }
      } catch (err) {
        console.error('Error checking API:', err);
        setApiStatus({ isChecking: false, isAvailable: false, url: window.API_URL || config.apiUrl });
      }
    };

    checkApiStatus();
  }, []);

  const handleQrCodeSubmit = async (e) => {
    e.preventDefault();
    if (!qrCode || verificationInProgress.current) return;
    await verifyMedicine(qrCode);
  };

  const handleScanSuccess = async (data) => {
    if (!data || verificationInProgress.current) return;
    
    setQrCode(data);
    setShowScanner(false);
    await verifyMedicine(data);
  };

  const verifyMedicine = async (code) => {
    // Prevent multiple simultaneous verification requests
    if (verificationInProgress.current) return;
    
    verificationInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Verifying QR code: ${code}`);
      console.log(`Using API URL: ${apiStatus.url}`);
      
      const response = await fetch(`${apiStatus.url}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          qrCode: code,
          location: 'Web Browser' 
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify medicine');
      }
      
      setVerificationResult(result);
    } catch (err) {
      console.error('Verification error:', err);
      
      // More specific error messages based on error type
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError(
          'Unable to connect to the verification server. ' +
          'Please check your internet connection and ensure the API server is running. ' +
          'API URL: ' + apiStatus.url
        );
      } else if (err.name === 'AbortError') {
        setError('Verification request timed out. The server might be overloaded or unavailable.');
      } else {
        setError(err.message || 'Failed to verify the medicine. Please try again.');
      }
    } finally {
      setIsLoading(false);
      // Reset the verification in progress flag after a short delay
      // to prevent accidental double-clicks
      setTimeout(() => {
        verificationInProgress.current = false;
      }, 1000);
    }
  };
  
  // Reset scanner when showing it again
  const handleShowScanner = () => {
    setShowScanner(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>MediChain</h1>
        <h2>Blockchain-Powered Drug Authenticity Verification</h2>
      </header>
      
      <main className="App-main">
        {apiStatus.isChecking ? (
          <div className="loading-container">
            <p>Connecting to blockchain service...</p>
          </div>
        ) : !apiStatus.isAvailable ? (
          <div className="error-message">
            <h3>Connection Error</h3>
            <p>Cannot connect to the blockchain service at {apiStatus.url}</p>
            <p>Please ensure the backend server is running and accessible.</p>
            <button 
              onClick={() => window.location.reload()}
              className="secondary-button"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <section className="verification-section">
              <h3>Verify Your Medicine</h3>
              
              {!showScanner ? (
                <>
                  <form onSubmit={handleQrCodeSubmit}>
                    <div className="form-group">
                      <label htmlFor="qrCode">Enter QR Code:</label>
                      <input 
                        type="text" 
                        id="qrCode"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        placeholder="Enter the unique QR code"
                      />
                    </div>
                    <div className="button-group">
                      <button type="submit" disabled={isLoading || !qrCode}>
                        {isLoading ? 'Verifying...' : 'Verify Medicine'}
                      </button>
                      <button 
                        type="button" 
                        className="secondary-button"
                        onClick={handleShowScanner}
                      >
                        Scan QR Code
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="scanner-container">
                  <QRCodeScanner onScanSuccess={handleScanSuccess} />
                  <button 
                    className="secondary-button" 
                    onClick={() => setShowScanner(false)}
                  >
                    Cancel Scan
                  </button>
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}
            </section>
            
            {verificationResult && (
              <section className="result-section">
                <div className={`result-box ${verificationResult.isAuthentic && !verificationResult.isSuspicious ? 'authentic' : 'suspicious'}`}>
                  <h3>
                    {verificationResult.isAuthentic && !verificationResult.isSuspicious 
                      ? 'Medicine Verified ✓' 
                      : 'Suspicious Medicine ⚠'}
                  </h3>
                  
                  {verificationResult.isAuthentic && !verificationResult.isSuspicious ? (
                    <div className="drug-details">
                      <h4>Drug Details:</h4>
                      <p><strong>Name:</strong> {verificationResult.drugDetails.name}</p>
                      <p><strong>Manufacturer:</strong> {verificationResult.drugDetails.manufacturer}</p>
                      <p><strong>Batch Number:</strong> {verificationResult.drugDetails.batchNumber}</p>
                      <p><strong>Expiry Date:</strong> {new Date(verificationResult.drugDetails.expiryDate).toLocaleDateString()}</p>
                      <p><strong>Ingredients:</strong> {verificationResult.drugDetails.ingredients}</p>
                    </div>
                  ) : (
                    <div className="alert-message">
                      <p>This QR code has been scanned {verificationResult.scanCount} times, which may indicate a counterfeit product.</p>
                      <p>Please consult with your pharmacy or healthcare provider.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
            
            <section className="api-info">
              <p className="api-status">
                <small>
                  Connected to blockchain service at{' '}
                  <span className="api-url">{apiStatus.url}</span>
                </small>
              </p>
            </section>
          </>
        )}
        
        <section className="how-it-works">
          <h3>How It Works</h3>
          <ol>
            <li>
              <h4>QR Code Tagging</h4>
              <p>Every medicine package gets a unique QR code printed by the manufacturer.</p>
              <p>Scanning the QR code reveals details like manufacturer name, batch number, expiry date, and ingredients.</p>
            </li>
            <li>
              <h4>Blockchain Verification</h4>
              <p>Drug data is stored on a public blockchain (e.g., Ethereum).</p>
              <p>Patients/pharmacies scan the QR code to verify if the drug's blockchain record matches the physical package.</p>
            </li>
            <li>
              <h4>Alert System</h4>
              <p>If a QR code is scanned multiple times (indicating possible duplication), the system flags it as "suspicious."</p>
            </li>
          </ol>
        </section>
      </main>
      
      <footer className="App-footer">
        <p>MediChain: Fighting Counterfeit Medicines with Blockchain Technology</p>
        <p>© 2025 MediChain</p>
      </footer>
    </div>
  );
}

export default App;
