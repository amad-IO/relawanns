const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes - wrap Netlify functions
const registerHandler = require('./netlify/functions/register');
const getEventDetailsHandler = require('./netlify/functions/get-event-details');
const checkStatusHandler = require('./netlify/functions/check-status');

// Netlify function wrapper
const wrapNetlifyFunction = (handler) => {
  return async (req, res) => {
    try {
      const event = {
        httpMethod: req.method,
        headers: req.headers,
        body: req.method === 'POST' ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : null,
        queryStringParameters: req.query,
        path: req.path,
        isBase64Encoded: false
      };

      const response = await handler.handler(event, {});

      res.status(response.statusCode);
      Object.keys(response.headers || {}).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      res.send(response.body);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  };
};

// API endpoints
app.post('/.netlify/functions/register', wrapNetlifyFunction(registerHandler));
app.get('/.netlify/functions/get-event-details', wrapNetlifyFunction(getEventDetailsHandler));
app.get('/.netlify/functions/check-status', wrapNetlifyFunction(checkStatusHandler));

// Serve static files (Vite build)
app.use(express.static(path.join(__dirname, 'build'), { maxAge: '1d' }));

// SPA fallback - serve index.html for all other routes (must be last!)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Relawanns server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
