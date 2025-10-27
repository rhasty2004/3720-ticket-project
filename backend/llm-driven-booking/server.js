const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/llmRoutes');
const setup = require('./setup');

const app = express();
const PORT = process.env.PORT || 7001;

app.use(bodyParser.json());

// CORS for dev
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api/llm', routes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'llm-driven-booking' }));

setup()
  .then(() => {
    app.listen(PORT, () => console.log(`llm-driven-booking listening on ${PORT}`));
  })
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
