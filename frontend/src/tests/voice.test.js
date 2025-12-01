import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventsPage } from '../App';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock SpeechRecognition
class MockRecognition extends EventTarget {
  constructor() {
    super();
    this.lang = 'en-US';
    this.interimResults = false;
    this.maxAlternatives = 1;
  }
  start() {
    // simulate a short delay then dispatch result
    setTimeout(() => {
      const evt = { results: [ [ { transcript: 'Book 1 ticket for Concert A' } ] ] };
      this.dispatchEvent(new CustomEvent('result', { detail: evt, detail: evt, bubbles: true }));
      // also call onresult if set
      if (typeof this.onresult === 'function') this.onresult(evt);
    }, 10);
  }
  stop() {}
}

// Mock SpeechSynthesis
const mockSpeak = jest.fn();
const mockCancel = jest.fn();

beforeAll(() => {
  // Provide window.SpeechRecognition and webkitSpeechRecognition
  window.SpeechRecognition = MockRecognition;
  window.webkitSpeechRecognition = MockRecognition;
  window.speechSynthesis = { speak: mockSpeak, cancel: mockCancel };
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
});

test('renders microphone button and chat and processes a mock recognition result', async () => {
  render(
    <Router>
      <EventsPage />
    </Router>
  );
  const mic = screen.getByRole('button', { name: /start voice input|Start voice input/i });
  expect(mic).toBeInTheDocument();

  fireEvent.click(mic);

  // wait for the mocked recognition to append a message
  await waitFor(() => expect(screen.getByText(/You:/)).toBeInTheDocument(), { timeout: 1000 });

  // assistant message should be added after LLM call; since LLM endpoint may not be running, we at least verify the user transcription appears
  expect(screen.getByText(/You:/)).toHaveTextContent('You: Book 1 ticket for Concert A');
});
