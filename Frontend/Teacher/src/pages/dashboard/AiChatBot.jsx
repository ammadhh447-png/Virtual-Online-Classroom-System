import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { Paperclip, Send, Loader, X } from 'lucide-react';

const AiChatBot = () => {
  const { token } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:7000';
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('teacher_ai_chat') || '[]'));
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('teacher_ai_chat', JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() && !file) return;
    const userMsg = { id: Date.now(), role: 'teacher', text: input || (file && `Uploaded file: ${file.name}`), time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const form = new FormData();
      form.append('message', userMsg.text);
      if (file) form.append('file', file);

      const res = await axios.post(`${API}/api/ai/chat`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      const reply = res.data?.reply || 'No response from assistant.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply, time: new Date().toISOString() }]);
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: 'Sorry, AI service unreachable. Try again later.', time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const quickAsk = (q) => setInput(q);

  return (
    <div className="min-h-[70vh] bg-gray-900 p-6 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">AI Assistant — Teacher</h1>
        <p className="text-sm text-gray-400">Get help with grading rubrics, creating quizzes, or improving lesson plans.</p>
      </div>

      <div className="flex gap-6">
        <aside className="w-72 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold mb-2">Teacher Prompts</h3>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => quickAsk('Draft a short quiz of 10 MCQs about linked lists with answers.')} className="w-full text-left p-2 rounded hover:bg-gray-700">Create quiz</button></li>
            <li><button onClick={() => quickAsk('Suggest a grading rubric for a programming assignment focused on recursion.')} className="w-full text-left p-2 rounded hover:bg-gray-700">Grading rubric</button></li>
            <li><button onClick={() => quickAsk('Provide a lesson plan for a 45 minute class on sorting algorithms.')} className="w-full text-left p-2 rounded hover:bg-gray-700">Lesson plan</button></li>
            <li><button onClick={() => quickAsk('Identify students who may need remedial help based on recent submissions (provide indicators).')} className="w-full text-left p-2 rounded hover:bg-gray-700">Identify at-risk students</button></li>
          </ul>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-gray-800 border border-gray-700">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <p className="mb-2">No conversation yet.</p>
                <p className="text-sm">Use quick prompts or ask for classroom and grading assistance.</p>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={`mb-4 flex ${m.role === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-4 py-3 rounded-lg ${m.role === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-invert max-w-none text-sm">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-cyan-300" {...props} />,
                          em: ({ node, ...props }) => <em className="italic" {...props} />,
                          code: ({ node, ...props }) => <code className="bg-gray-900 px-2 py-1 rounded text-yellow-300 text-xs" {...props} />,
                          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-2 mb-1" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2 mb-1" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-cyan-400 pl-3 italic my-2" {...props} />,
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-2 text-right">{new Date(m.time).toLocaleString()}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
            {file && (
              <div className="mb-3 p-2 bg-gray-700 rounded border border-gray-600 flex items-center justify-between">
                <span className="text-sm text-gray-300">📎 {file.name}</span>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask the assistant (e.g., grading tips, quiz ideas)..." className="flex-1 px-4 py-3 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-indigo-500" />
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                <Paperclip className="w-4 h-4" />
                <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" />
              </label>
              <button onClick={send} disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white flex items-center gap-2 disabled:bg-gray-600">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} <span>{loading ? 'Thinking...' : 'Send'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Conversations are stored locally. Upload non-sensitive files only.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AiChatBot;