import React, { useState, useRef } from 'react';
import axios from 'axios';

const StudentChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const listRef = useRef(null);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';

    const send = async () => {
        if (!input && !file) return;
        const userMsg = { from: 'user', text: input || (file && `Uploaded file: ${file.name}`) };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const form = new FormData();
            form.append('message', userMsg.text || '');
            if (file) form.append('file', file);

            const res = await axios.post(`${API}/api/ai/chat`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            const reply = res.data?.reply || 'No reply';
            setMessages(prev => [...prev, { from: 'bot', text: reply }]);
            setFile(null);
            // scroll
            setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, failed to get response.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <div className="max-h-64 overflow-y-auto mb-3">
                {messages.map((m, i) => (
                    <div key={i} className={`mb-2 ${m.from === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block p-2 rounded ${m.from === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-200'}`}>{m.text}</div>
                    </div>
                ))}
                <div ref={listRef} />
            </div>

            <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your grades, assignments or meetings..." className="flex-1 px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white" />
                <input type="file" onChange={e => setFile(e.target.files[0])} className="text-sm text-gray-400" />
                <button onClick={send} disabled={loading} className="px-4 py-2 bg-cyan-600 rounded text-white">{loading ? '...' : 'Send'}</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tip: ask about upcoming meetings, assignment status, or upload a file for context.</p>
        </div>
    );
};

export default StudentChat;
