import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import QRCodeScanner from './components/QRCodeScanner';
import config from './config';
import RegisterDrug from './pages/RegisterDrug';

function Home() {
  const [qrCode, setQrCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to track if verification is in progress
  const verificationInProgress = useRef(false);

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
      const response = await fetch(`${config.apiUrl}/verify`, {
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
      setError(err.message || 'Failed to verify the medicine. Please try again.');
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
    <div className="App-content">
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
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>MediChain</h1>
          <h2>Blockchain-Powered Drug Authenticity Verification</h2>
          <nav className="main-nav">
            <Link to="/" className="nav-button home-button">
              <div className="icon-container">
                <i className="icon home-icon"></i>
              </div>
              <span>Home</span>
            </Link>
            <Link to="/register" className="nav-button register-button">
              <div className="icon-container">
                <i className="icon register-icon"></i>
              </div>
              <span>Register Drug</span>
            </Link>
          </nav>
        </header>
        
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<RegisterDrug />} />
          </Routes>
        </main>
        
        <footer className="App-footer">
          <p>MediChain: Fighting Counterfeit Medicines with Blockchain Technology</p>
          <p>© 2025 MediChain</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
