const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import sqlite3 from this microservice
const sqlite3 = require('sqlite3').verbose();
const { initDb } = require('../shared-db/database'); // adjust relative path

// Initialize DB and pass sqlite3
const db = initDb(sqlite3);

// Make db available to other modules (optional, e.g., User model)
global.db = db;

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Auth service is running' });
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

module.exports = app;


/*const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// auth-service/server.js
const sqlite3 = require('sqlite3');
const { initDb } = require('../shared-db/database');
const db = initDb(sqlite3);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Auth service is running' });
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

module.exports = app;*/