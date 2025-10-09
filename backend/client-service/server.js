const express = require('express');
const bodyParser = require('body-parser');
const clientRoutes = require('./routes/clientRoutes');
const setup = require('./setup');

const app = express();
const PORT = process.env.PORT || 6001;

// Middleware
app.use(bodyParser.json());

// allow requests from the frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Routes
app.use('/api', clientRoutes);

// Health-check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'client-service' }));

// Initialize DB and start
setup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`client-service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB setup failed:', err);
    process.exit(1);
  });