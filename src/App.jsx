import React, { useState, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import './App.css';

// Вставь свой URL Centrifugo и токен ниже
const CENTRIFUGO_URL = 'ws://localhost:8000/connection/websocket'; // пример
const CENTRIFUGO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTUwMjM3NTEsInB1Ymxpc2giOnRydWUsInN1YiI6IjkwYTQ5OTY1LWFlOWYtNDVmNS1hNjY1LWY4MzU3NTE3MjI5NyJ9.ZIkwKZH0h6CulM3NKAhv4oCmwVgnOt6ieYX_ZrapcJo'

function App() {
    const [channel, setChannel] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const centrifugeRef = useRef(null);
    const subRef = useRef(null);

    const connect = () => {
        if (centrifugeRef.current) {
            centrifugeRef.current.disconnect();
        }
        const centrifuge = new Centrifuge(CENTRIFUGO_URL, {
            token: CENTRIFUGO_TOKEN,
        });
        centrifuge.on('connect', () => setConnected(true));
        centrifuge.on('disconnect', () => setConnected(false));
        centrifuge.connect();
        centrifugeRef.current = centrifuge;
    };

    const subscribe = () => {
        if (!centrifugeRef.current) {
            connect();
        }
        if (subRef.current) {
            subRef.current.unsubscribe();
        }
        // Новый способ подписки
        const sub = centrifugeRef.current.newSubscription(channel);
        sub.on('publication', ctx => {
            setMessages(msgs => [...msgs, ctx.data]);
        });
        sub.on('subscribe', () => {
            setMessages([]);
        });
        sub.subscribe();
        subRef.current = sub;
    };

    const publish = async () => {
        if (!centrifugeRef.current) return;
        let payload;
        try {
            // Пробуем распарсить message как JSON
            payload = JSON.parse(message);
        } catch {
            // Если не получилось — отправляем как строку
            payload = { text: message };
        }
        try {
            await centrifugeRef.current.publish(channel, payload);
            setMessage('');
        } catch (e) {
            alert('Ошибка публикации: ' + e.message);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
            <h2>Centrifugo Web Tester</h2>
            <div style={{ marginBottom: 20 }}>
                <label>Channel:&nbsp;
                    <input value={channel} onChange={e => setChannel(e.target.value)} placeholder="channel name" />
                </label>
                <button onClick={subscribe} disabled={!channel}>Subscribe</button>
            </div>
            <div style={{ marginBottom: 20 }}>
                <label>Message:&nbsp;
                    <input value={message} onChange={e => setMessage(e.target.value)} placeholder="message text" />
                </label>
                <button onClick={publish} disabled={!message || !channel}>Publish</button>
            </div>
            <div>
                <strong>Status:</strong> {connected ? 'Connected' : 'Disconnected'}
            </div>
            <div style={{ marginTop: 30 }}>
                <h4>Messages:</h4>
                <div style={{ background: '#f9f9f9', minHeight: 100, padding: 10, border: '1px solid #ddd' }}>
                    {messages.length === 0 ? <em>No messages yet</em> :
                        messages.map((msg, i) => (
                            <div key={i} style={{ marginBottom: 8, color: '#333', background: '#fff', padding: 5, borderRadius: 4 }}>
                                {typeof msg === 'object' ? JSON.stringify(msg) : String(msg)}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default App;
