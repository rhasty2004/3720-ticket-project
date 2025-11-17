TigerTix Test Plan

Overview
--------
Describes the testing strategy for TigerTix (backend, LLM booking, and frontend voice UI).

1) Testing Strategy
-------------------
- Unit tests: fast and isolated tests for small functions. Uses Jest for Node services and React Testing Library + Jest for frontend.
- Integration tests: exercise multiple components together; for backend, run the service with a test sqlite database or mocked DB. For LLM, mock network responses when testing parsing logic or run fallback parser.
- End-to-End: interact with the running app via HTTP or browser automation to verify (list events, propose booking, confirm). Voice features need a manual browser test.
- Accessibility tests: use keyboard/screen reader checks and automated tools

2) Automated tests
- backend/llm-driven-booking: adds Jest tests for the simple fallback parser: tests/llmController.test.js`.
- backend/client-service: adds Jest tests for client model functions using a mocked DB: tests/clientModel.test.js`.

running automated tests
# llm-driven-booking
cd backend/llm-driven-booking
npm install
npm test

# client-service
cd backend/client-service
npm install
npm test

# frontend
cd /Users/tommyhasty/3720-ticket-project/frontend
npm test -- --watchAll=false


3) Manual Testing
A. Booking via natural language (text)
- Start services and run:
curl -X POST http://localhost:7001/api/llm/reserve \
  -H "Content-Type: application/json" \
  -d '{"event":"Concert A","tickets":5}'
  
  confirm:
curl -X POST http://localhost:7001/api/llm/confirm \
  -H "Content-Type: application/json" \
  -d '{"reservationId":3}'

B. Booking via voice (manual)
- Open frontend in Chrome, click the microphone button, speak: "Show me concerts" or "Book 1 ticket for Concert A".
- Expect: displayed transcription, assistant response text, and spoken response. Purchases must still be manual.

C. Accessibility checks (manual)
- Navigate app with keyboard only (Tab/Enter), ensure focus indicators and aria-live messages announce updates.
- Test with a screen reader (NVDA/VoiceOver) to confirm events and chat messages are readable.

D. Concurrency test (manual)
- Use the provided concurrency script (or run multiple curl requests in parallel) to attempt purchasing the same ticket concurrently and confirm only one purchase succeeds by inspecting DB.

4) Test reporting
-----------------
llm-testing:
 PASS tests/llmController.test.js
  llmController simpleParse fallback
    ✓ parses book intent with tickets and event (2 ms)
    ✓ parses list intent
    ✓ returns null for unparseable text

client service testing:
 FAIL  tests/clientModel.test.js (5.276 s)
  clientModel
    ✓ getAllEvents returns rows (2 ms)
    ✕ purchaseTicket returns updated row on success (5002 ms)

admin servic testing:
 --runInBand
 PASS  tests/admin.test.js
  admin-service
    ✓ adminModel.createEvent inserts and returns created row (2 ms)
    ✓ adminController.createEvent responds with created id (1 ms)

frontend testing:
Test Suites: 3 passed, 3 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.527 s
Ran all test suites.



Booking via natural language:
{"event":"Concert A","tickets":2,"intent":"book"}%   



