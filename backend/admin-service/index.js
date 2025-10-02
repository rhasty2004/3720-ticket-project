const express = require('express');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/adminRoutes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/admin', adminRoutes);

// Basic health-check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'admin-service' }));

// Start after DB init
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`admin-service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
