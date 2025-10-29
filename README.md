# 3720-ticket-project

# SPRINT 1
running admin service
cd backend/admin-service
PORT=5001 node server.js
new terminal:
curl -X POST http://localhost:5001/api/admin/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin Event","date":"2025-11-16T19:00:00Z","tickets":100}' \
  -i

running client service
cd backend/client-service
npm start
new terminal:
curl -X GET 'http://localhost:6001/api/events'
curl -X POST 'http://localhost:6001/api/events/1/purchase' -i

running frontend:
backend terminal:
cd backend/client-service
PORT=6001 node server.js
frontend terminal:
cd frontend
REACT_APP_CLIENT_URL=http://localhost:6001 npm start



# SPRINT 2
running llm service w/ frontend:
Terminal 1: start client-service (port 6001)
cd /Users/tommyhasty/3720-ticket-project/backend/client-service
PORT=6001 node server.js

Terminal 2: start llm-driven-booking (port 7001)
cd /Users/tommyhasty/3720-ticket-project/backend/llm-driven-booking
PORT=7001 node server.js

(optional) Terminal 3: start admin-service (port 5001)
cd /Users/tommyhasty/3720-ticket-project/backend/admin-service
PORT=5001 node server.js

Terminal 4: start the frontend (will open dev server)
cd /Users/tommyhasty/3720-ticket-project/frontend
REACT_APP_CLIENT_URL=http://localhost:6001 REACT_APP_LLM_URL=http://localhost:7001 npm start