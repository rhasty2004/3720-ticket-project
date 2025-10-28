Voice enabled Interface for (TigerTix)

- Microphone button in the app that plays a short beep and records using the Web Speech API.
- Recognized text is displayed in an in-app chat window before being sent to the LLM service.
- The frontend posts transcriptions to the llm-driven-booking parse endpoint at:
  - default: http://localhost:7001/api/llm/parse
  - override with env var: REACT_APP_LLM_URL
- The assistant reply is displayed and spoken using the SpeechSynthesis API.

How to test locally:
1. Start the `llm-driven-booking` service on port 7001 (or set `REACT_APP_LLM_URL`).
2. Start frontend (npm start) and open it in a browser that supports the Web Speech API (Chrome).
3. Click the "🎤 Speak" button, allow microphone access, speak a request (e.g: "Show me concerts with available tickets"), and listen/read the assistant response.

Note:
- No tickets are booked automatically; the assistant may propose a booking but purchases must be done using the "Buy ticket" buttons.
