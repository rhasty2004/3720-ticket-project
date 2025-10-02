const express = require('express');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/adminRoutes');
const setup = require('./setup');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/admin', adminRoutes);

// Health-check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'admin-service' }));

// Initialize DB and start
setup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`admin-service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB setup failed:', err);
    process.exit(1);
  });
