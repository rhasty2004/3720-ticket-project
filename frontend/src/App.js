import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const BASE = process.env.REACT_APP_CLIENT_URL || 'http://localhost:5000';

/*
	Main app component for the frontend
	Handles displaying events and purchasing tickets
	also allows accessibility features
*/
function App() {
  const [events, setEvents] = useState([]);
  const [loadingMap, setLoadingMap] = useState({});
  const [message, setMessage] = useState(null);
	// Voice / chat state
	const [chat, setChat] = useState([]); // { from: 'user'|'llm', text }
	const [recording, setRecording] = useState(false);
	const recognitionRef = useRef(null);
	const audioRef = useRef(null);

  useEffect(() => {
    let mounted = true;
	  async function load() {
	    try {
		  const res = await fetch(`${BASE}/api/events`);
		  const data = await res.json();
		  // support both { events: [...] } and direct array
		  const list = Array.isArray(data) ? data : data.events || [];
		  if (mounted) setEvents(list);
		} catch (err) {
		  console.error('Failed to load events', err);
		  if (mounted) setMessage('Failed to load events');
		}
	  }
	  load();
	  return () => { mounted = false; };
  }, []);

	// initialize SpeechRecognition if available
	useEffect(() => {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) return undefined;
		const r = new SpeechRecognition();
		r.lang = 'en-US';
		r.interimResults = false;
		r.maxAlternatives = 1;
		r.onresult = (evt) => {
			const text = (evt.results[0] && evt.results[0][0] && evt.results[0][0].transcript) || '';
			if (text) {
				// show recognized text and send to LLM
				const userMsg = { from: 'user', text };
				setChat(c => [...c, userMsg]);
				sendToLLM(text);
			}
			setRecording(false);
		};
		r.onerror = (e) => {
			console.error('Speech recognition error', e);
			setMessage('Voice recognition error');
			setRecording(false);
		};
		recognitionRef.current = r;
		return () => {
			try { r.onresult = null; r.onerror = null; } catch (e) {}
		};
	}, []);

	// short beep audio to play before recording
	useEffect(() => {
		const ctx = typeof AudioContext !== 'undefined' ? new AudioContext() : null;
		audioRef.current = ctx;
		return () => {
			try { ctx && ctx.close && ctx.close(); } catch (e) {}
		};
	}, []);

	function playBeep() {
		try {
			const ctx = audioRef.current;
			if (!ctx) return;
			const o = ctx.createOscillator();
			const g = ctx.createGain();
			o.type = 'sine';
			o.frequency.value = 880;
			o.connect(g);
			g.connect(ctx.destination);
			o.start();
			g.gain.setValueAtTime(0.0001, ctx.currentTime);
			g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.01);
			g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
			setTimeout(() => { try { o.stop(); } catch (e) {} }, 200);
		} catch (e) {
			// ignore
		}
	}

	async function startRecording() {
		const r = recognitionRef.current;
		if (!r) {
			setMessage('SpeechRecognition not supported in this browser');
			return;
		}
		setMessage(null);
		playBeep();
		try {
			setRecording(true);
			r.start();
		} catch (e) {
			console.error('startRecording failed', e);
			setRecording(false);
		}
	}

	async function sendToLLM(text) {
		// call the llm-driven-booking parse endpoint
		try {
			const res = await fetch((process.env.REACT_APP_LLM_URL || 'http://localhost:7001') + '/api/llm/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			if (!res.ok) {
				const err = await res.text().catch(() => '');
				throw new Error(err || 'LLM service error');
			}
			const data = await res.json();
			const textOut = data && (data.response || data.text || JSON.stringify(data));
			const llmMsg = { from: 'llm', text: String(textOut) };
			setChat(c => [...c, llmMsg]);
			// speak the response
			speakText(llmMsg.text);
		} catch (err) {
			console.error('LLM call failed', err);
			setMessage('Failed to contact LLM service');
		}
	}

	function speakText(text) {
		try {
			if (!window.speechSynthesis) return;
			window.speechSynthesis.cancel();
			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = 'en-US';
			// pacing and clarity
			utter.rate = 0.95;
			utter.pitch = 1.0;
			utter.volume = 1.0;
			window.speechSynthesis.speak(utter);
		} catch (e) {
			console.error('speakText failed', e);
		}
	}

  async function buyTicket(id) {
    setMessage(null);
	setLoadingMap(m => ({ ...m, [id]: true }));
	try {
	const res = await fetch(`${BASE}/api/events/${id}/purchase`, { method: 'POST' });
    if (!res.ok) {
	  const err = await res.json().catch(() => ({}));
	  throw new Error(err.error || 'Purchase failed');
	}
	const data = await res.json();
	// response may be { event: {...} } or { message, event }
	const updated = data.event || data;
	setEvents(prev => prev.map(ev => (ev.id === updated.id ? updated : ev)));
	setMessage('Ticket purchased successfully');
	} catch (err) {
	  console.error('purchase error', err);
	  setMessage(err.message || 'Purchase failed');
	} finally {
	  setLoadingMap(m => ({ ...m, [id]: false }));
	}
  }

  return (
    <div className="App" style={{ padding: 20 }}>
	  <header>
	    <h1>TigerTix</h1>
		</header>
		<main>
		{/* Voice chat panel for visually impaired users */}
		<section aria-label="Voice assistant" style={{ marginTop: 18, marginBottom: 18 }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
		    <button
			  onClick={startRecording}
			  aria-pressed={recording}
			  aria-label={recording ? 'Recording' : 'Start voice input'}
			  style={{ padding: '8px 12px' }}
			  >
			  {recording ? 'Recording…' : '🎤 Speak'}
			  </button>
			  <div aria-live="polite">{recording ? 'Listening...' : 'Click to speak your request'}</div>
		  </div>
		  <div style={{ marginTop: 12 }}>
		    <div className="chat-window" aria-live="polite" aria-label="Conversation with assistant">
			  {chat.length === 0 && <div className="chat-empty">Assistant ready — try asking about events</div>}
			  {chat.map((m, i) => (
			    <div key={i} className={`chat-msg ${m.from}`}>{m.from === 'user' ? 'You: ' : 'Assistant: '}{m.text}</div>
			  ))}
			</div>
		  </div>
		</section>
		{/* Status region for screen readers */}
		{message && (
		<div
		  role="status"
		  aria-live="polite"
		  tabIndex={-1}
		  style={{ marginBottom: 12, color: 'green' }}
		>
		{message}
		</div>
		)}

		<section aria-label="Events">
		  <ul style={{ listStyle: 'none', padding: 0 }} aria-live="polite">
		    {events.map(event => (
			<li
			  key={event.id}
			  style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}
								>
			<article aria-labelledby={`event-${event.id}`}>
			<h2 id={`event-${event.id}`} style={{ fontWeight: 600, margin: 0 }}>{event.name}</h2>
			<p style={{ color: '#555', margin: '4px 0' }}>
			<time dateTime={event.date}>{new Date(event.date).toLocaleString()}</time>
			</p>
			<p id={`tickets-${event.id}`}>Tickets available: <strong>{event.tickets}</strong></p>

			<button
			  onClick={() => buyTicket(event.id)}
			  disabled={loadingMap[event.id] || event.tickets <= 0}
		      aria-disabled={loadingMap[event.id] || event.tickets <= 0}
			  aria-label={
			  loadingMap[event.id]
			  ? `Processing purchase for ${event.name}`
			  : event.tickets > 0
			  ? `Buy ticket for ${event.name}. ${event.tickets} tickets available.`
			  : `Sold out for ${event.name}`
			}
			title={event.tickets > 0 ? `Buy ticket for ${event.name}` : `Sold out`}
			style={{ marginTop: 8 }}
										>
			{loadingMap[event.id] ? 'Processing...' : event.tickets > 0 ? `Buy ticket for ${event.name}` : 'Sold out'}
			</button>
			</article>
			</li>
			))}
			</ul>
			</section>
			</main>
		</div>
  );
}

export default App;