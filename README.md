# 3720-ticket-project


running llm service w/ frontend:

SPRINT 2:

# Terminal 1: start client-service (port 6001)
cd /Users/tommyhasty/3720-ticket-project/backend/client-service
PORT=6001 node server.js

# Terminal 2: start llm-driven-booking (port 7001)
cd /Users/tommyhasty/3720-ticket-project/backend/llm-driven-booking
PORT=7001 node server.js

# (optional) Terminal 3: start admin-service (port 5001)
cd /Users/tommyhasty/3720-ticket-project/backend/admin-service
PORT=5001 node server.js

# Terminal 4: start the frontend (will open dev server)
cd /Users/tommyhasty/3720-ticket-project/frontend
REACT_APP_CLIENT_URL=http://localhost:6001 REACT_APP_LLM_URL=http://localhost:7001 npm start