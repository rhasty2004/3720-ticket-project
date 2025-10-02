const express = require('express');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/clientRoutes');
const setup = require('./setup');

const app = express();
const PORT = process.env.PORT || 6001;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/client', clientRoutes);

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