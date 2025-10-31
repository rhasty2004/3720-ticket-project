const model = require('../models/llmModel');

/*
  Very small parser fallback. 
  text: input text to parse
  Returns { event, tickets, intent }
*/
function simpleParse(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  if (lower.includes('book') || lower.includes('purchase')) {
    // find number
    const numMatch = lower.match(/(\d+)\s*(tickets?|seats?)/);
    const tickets = numMatch ? parseInt(numMatch[1], 10) : 1;
    // find event name heuristically
    let event = null;
    const forMatch = text.match(/for\s+(.+)$/i);
    if (forMatch) event = forMatch[1].trim().replace(/[.?!]$/, '');
    return { event, tickets, intent: 'book' };
  }
  // other commands
  if (lower.includes('list') || lower.includes('show')) return { intent: 'list' };
  return null;
}

/*
  Calls the LLM (uses openAI) to parse the input text
  text: input text to parse
  returns parsed object { event, tickets, intent }
*/
async function callLLM(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('No OPENAI_API_KEY');

  const base = process.env.OPENAI_API_BASE || 'https://api.openai.com';
  const url = `${base}/v1/chat/completions`;

  // System prompt asks for strict JSON output
  const system = `You are a JSON extractor. Extract only JSON containing keys: event (string or null), tickets (integer), intent (one of \"book\", \"list\", or \"other\"). Reply with only valid JSON and no other text.`;
  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: text }
    ],
    temperature: 0
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`LLM error: ${resp.status} ${txt}`);
  }

  const j = await resp.json();
  const textOut = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!textOut) throw new Error('No content from LLM');

  // Try to parse JSON from the model output
  try {
    const parsed = JSON.parse(textOut);
    return parsed;
  } catch (e) {
    // Try to extract JSON substring
    const m = textOut.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch (e2) { /* continue to fallback */ }
    }
    throw new Error('Failed to parse JSON from LLM output');
  }
}

async function parse(req, res) {
  const { text } = req.body || {};

  // Prefer LLM if API key provided, otherwise fallback to simple parser
  if (process.env.OPENAI_API_KEY) {
    try {
      const parsed = await callLLM(text);
      // validate shape
      if (!parsed || typeof parsed !== 'object' || !('intent' in parsed)) {
        throw new Error('Invalid LLM output');
      }
      return res.json(parsed);
    } catch (err) {
      console.error('LLM parse failed:', err.message || err);
      // fall through to simple parser
    }
  }

  const parsed = simpleParse(text);
  if (!parsed) return res.status(400).json({ error: 'Could not parse input. Try: "Book 2 tickets for Concert A"' });
  return res.json(parsed);
}

/* 
  Confirm booking: expects { event, tickets
  req: request object with body containing event and tickets or reservationId
  res: response object to send result
  returns JSON response with booking confirmation or error
*/
async function confirm(req, res) {
  // Support two modes:
  // 1) Direct confirm with { event, tickets }
  // 2) Confirm via reservationId: { reservationId }
  const { event, tickets, reservationId } = req.body || {};
  if (!reservationId && (!event || !tickets)) return res.status(400).json({ error: 'Missing event/tickets or reservationId' });

  try {
    let result;
    if (reservationId) {
      result = await model.confirmReservation({ reservationId });
    } else {
      result = await model.bookEvent({ event, tickets });
    }
    if (!result) return res.status(400).json({ error: 'Not enough tickets or event not found' });
    return res.json({ message: 'Booking confirmed', booking: result });
  } catch (err) {
    console.error('confirm error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/*
  Reserve booking: expects { event, tickets }
  req: request object with body containing event and tickets
  res: response object to send result
  returns JSON response with reservation details or error
*/
async function reserve(req, res) {
  const { event, tickets } = req.body || {};
  if (!event || !tickets) return res.status(400).json({ error: 'Missing event or tickets' });
  try {
    const r = await model.createReservation({ event, tickets });
    if (!r) return res.status(400).json({ error: 'Not enough tickets or event not found' });
    return res.json({ message: 'Reservation created', reservation: r });
  } catch (err) {
    console.error('reserve error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { parse, reserve, confirm, _simpleParse: simpleParse };
