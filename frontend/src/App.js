import React, { useEffect, useState } from 'react';
import './App.css';

const BASE = process.env.REACT_APP_CLIENT_URL || 'http://localhost:5000';

function App() {
	const [events, setEvents] = useState([]);
	const [loadingMap, setLoadingMap] = useState({});
	const [message, setMessage] = useState(null);

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
			<h1>TigerTix</h1>
			{message && (
				<div style={{ marginBottom: 12, color: 'green' }}>{message}</div>
			)}
			<ul style={{ listStyle: 'none', padding: 0 }}>
				{events.map(event => (
					<li key={event.id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
						<div style={{ fontWeight: 600 }}>{event.name}</div>
						<div style={{ color: '#555' }}>{new Date(event.date).toLocaleString()}</div>
						<div>Tickets available: {event.tickets}</div>
						<button
							onClick={() => buyTicket(event.id)}
							disabled={loadingMap[event.id] || event.tickets <= 0}
							style={{ marginTop: 8 }}
						>
							{loadingMap[event.id] ? 'Processing...' : event.tickets > 0 ? 'Buy Ticket' : 'Sold out'}
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

export default App;