import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, CircularProgress, Alert, Divider } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const RegisterDrug = () => {
  const [formData, setFormData] = useState({
    qrCode: '',
    name: '',
    manufacturer: '',
    batchNumber: '',
    manufactureDate: null,
    expiryDate: null,
    ingredients: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [curlCommand, setCurlCommand] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleDateChange = (name) => (date) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: date
    }));
  };

  const generateCurlCommand = () => {
    const data = { ...formData };
    
    // Format dates as ISO strings for the curl command
    if (data.manufactureDate) {
      data.manufactureDate = data.manufactureDate.toISOString();
    }
    if (data.expiryDate) {
      data.expiryDate = data.expiryDate.toISOString();
    }
    
    const jsonData = JSON.stringify(data, null, 2);
    const command = `curl -X POST https://0f03-146-196-32-136.ngrok-free.app/api/register \\
  -H "Content-Type: application/json" \\
  -d '${jsonData}'`;
    
    setCurlCommand(command);
    return command;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Generate curl command for display
      generateCurlCommand();
      
      const requestData = { ...formData };
      
      // Format dates for API
      if (requestData.manufactureDate) {
        requestData.manufactureDate = requestData.manufactureDate.toISOString();
      }
      if (requestData.expiryDate) {
        requestData.expiryDate = requestData.expiryDate.toISOString();
      }

      const response = await fetch('https://0f03-146-196-32-136.ngrok-free.app/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register drug');
      }
      
      setResponse(data);
    } catch (err) {
      setError(err.message || 'Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Register Drug
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>
            <TextField
              label="QR Code"
              name="qrCode"
              value={formData.qrCode}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Drug Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Batch Number"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              required
              fullWidth
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Manufacture Date"
                value={formData.manufactureDate}
                onChange={handleDateChange('manufactureDate')}
                renderInput={(params) => <TextField {...params} />}
                fullWidth
              />
              <DatePicker
                label="Expiry Date"
                value={formData.expiryDate}
                onChange={handleDateChange('expiryDate')}
                renderInput={(params) => <TextField {...params} />}
                required
                fullWidth
              />
            </LocalizationProvider>
            <TextField
              label="Ingredients"
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              sx={{ gridColumn: '1 / span 2' }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Register Drug on Blockchain'}
          </Button>
        </form>

        {curlCommand && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Generated cURL Command
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.900',
                color: 'grey.100',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0 }}>{curlCommand}</pre>
            </Paper>
            <Button 
              sx={{ mt: 1 }}
              size="small"
              onClick={() => {navigator.clipboard.writeText(curlCommand)}}
            >
              Copy to clipboard
            </Button>
          </Box>
        )}

        {response && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Server Response
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              {response.message || 'Drug registered successfully!'}
            </Alert>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}

        {error && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Error
            </Typography>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default RegisterDrug;