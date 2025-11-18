import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BASE = process.env.REACT_APP_CLIENT_URL || 'http://localhost:5000';

// ===== AUTH CONTEXT =====
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = 'http://localhost:3001/api/auth';

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${API_URL}/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const register = async (email, password, role = 'client') => {
    try {
      const response = await axios.post(`${API_URL}/register`, { email, password, role });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== NAVBAR COMPONENT =====
function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">TigerTix</Link>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <span>Logged in as {user.email}</span>
            <Link to="/events">Events</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ===== LOGIN COMPONENT =====
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/events');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

// ===== REGISTER COMPONENT =====
function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await register(email, password);
    if (result.success) {
      navigate('/events');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

// ===== PROTECTED ROUTE COMPONENT =====
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

// ===== EVENTS PAGE (YOUR ORIGINAL CODE) =====
function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loadingMap, setLoadingMap] = useState({});
  const [message, setMessage] = useState(null);
  // Voice / chat state
  const [chat, setChat] = useState([]);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${BASE}/api/events`);
        const data = await res.json();
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
      speakText(llmMsg.text);
    } catch (err) {
      console.error('LLM call failed', err);
      setMessage('No valid input. Try saying "list" or "book".');
    }
  }

  function speakText(text) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
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
    <div style={{ padding: 20 }}>
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

// ===== MAIN APP COMPONENT =====
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <header>
            <h1 style={{ textAlign: 'center', margin: '20px 0' }}>TigerTix</h1>
            <Navbar />
          </header>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/events" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;