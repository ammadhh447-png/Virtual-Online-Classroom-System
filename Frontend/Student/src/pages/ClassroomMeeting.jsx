import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { faker } from '@faker-js/faker';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MessageSquare, Users, Settings, Phone, Hand, MoreVertical, Send, Smile, Paperclip, ArrowLeft, Bot, User, GraduationCap, X
} from 'lucide-react';

const ClassroomMeeting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [messages, setMessages] = useState({ students: [], ai: [], tutor: [] });
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  const [participants] = useState(() => Array.from({ length: faker.number.int({ min: 5, max: 12 }) }, () => ({
    id: faker.string.uuid(), name: faker.person.fullName(), isVideoOn: faker.datatype.boolean(), isAudioOn: faker.datatype.boolean(), isHandRaised: faker.datatype.boolean({ probability: 0.2 })
  })));

  useEffect(() => {
    setMessages({
      students: [{ id: 1, sender: faker.person.fullName(), message: "Could you please explain the last concept again?", time: "10:30 AM", isOwn: false }],
      ai: [{ id: 1, sender: "AI Assistant", message: "Hello! I'm here to help you. What would you like to know?", time: "10:00 AM", isOwn: false, isBot: true }],
      tutor: [{ id: 1, sender: "Prof. Johnson", message: "Welcome! Feel free to ask questions.", time: "10:00 AM", isOwn: false, isTutor: true }]
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const message = { id: Date.now(), sender: "You", message: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOwn: true };
    setMessages(prev => ({ ...prev, [activeTab]: [...prev[activeTab], message] }));
    setNewMessage('');

    setTimeout(() => {
      let response;
      if (activeTab === 'ai') {
        response = { id: Date.now() + 1, sender: "AI Assistant", message: `I understand your question about "${newMessage}". Here's what I can explain...`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOwn: false, isBot: true };
      } else if (activeTab === 'tutor') {
        response = { id: Date.now() + 1, sender: "Prof. Johnson", message: "That's a great question!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOwn: false, isTutor: true };
      } else {
        response = { id: Date.now() + 1, sender: faker.person.fullName(), message: "I had the same question!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOwn: false };
      }
      setMessages(prev => ({ ...prev, [activeTab]: [...prev[activeTab], response] }));
    }, 1000);
  };

  const renderMessage = (message) => (
    <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${message.isOwn ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium ${message.isBot ? 'bg-purple-500' : message.isTutor ? 'bg-green-500' : message.isOwn ? 'bg-cyan-500' : 'bg-gray-600'}`}>
          {message.isBot ? <Bot className="w-4 h-4" /> : message.isTutor ? <GraduationCap className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className={`px-4 py-2 rounded-lg ${message.isOwn ? 'bg-cyan-500 text-white' : message.isBot ? 'bg-purple-500/20 border border-purple-500/30' : message.isTutor ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700'}`}>
          {!message.isOwn && <p className={`text-xs font-medium mb-1 ${message.isBot ? 'text-purple-400' : message.isTutor ? 'text-green-400' : 'text-gray-400'}`}>{message.sender}</p>}
          <p className="text-sm">{message.message}</p>
          <p className="text-xs text-gray-400 mt-1">{message.time}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 p-3 sm:p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-700 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base sm:text-xl font-semibold truncate">Data Structures</h1>
          <span className="bg-red-500 px-2 py-1 rounded text-xs sm:text-sm">LIVE</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400 hidden sm:inline">{participants.length + 1} participants</span>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors"><Users className="w-5 h-5" /></button>
          <button onClick={() => {
            // open Excalidraw collaborative room using class identifier if available
            const room = user?.rollYear && user?.rollDept && user?.section ? `${user.rollYear}-${user.rollDept}-${user.section}` : `room-${Date.now()}`;
            const url = `https://excalidraw.com/#room=${encodeURIComponent(room)}`;
            window.open(url, '_blank');
          }} className="ml-2 p-2 bg-gray-700 rounded hover:bg-gray-600">Whiteboard</button>
        </div>
      </div>

      <div className="flex-1 p-2 sm:p-4 bg-gray-900 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 h-full">
          <div className="col-span-2 bg-gray-800 rounded-lg relative overflow-hidden flex items-center justify-center">
            <div className="text-center"><GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-blue-400" /><h3 className="text-lg sm:text-xl font-semibold">Prof. Johnson</h3><p className="text-gray-300">Instructor</p></div>
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/50 px-2 py-1 rounded text-xs sm:text-sm">Prof. Johnson</div>
          </div>
          <div className="bg-gray-800 rounded-lg relative overflow-hidden flex items-center justify-center">
            {isVideoOn ? <div className="text-center"><User className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-cyan-400" /><p className="text-xs sm:text-sm">You</p></div> : <VideoOff className="w-8 h-8 text-gray-400" />}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center">You {!isAudioOn && <MicOff className="w-3 h-3 inline ml-1" />}</div>
          </div>
          {participants.slice(0, 5).map(p => (
            <div key={p.id} className="bg-gray-800 rounded-lg relative overflow-hidden flex items-center justify-center">
              {p.isVideoOn ? <div className="text-center"><User className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 text-gray-400" /><p className="text-xs truncate">{p.name.split(' ')[0]}</p></div> : <VideoOff className="w-6 h-6 text-gray-400" />}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center truncate">{p.name.split(' ')[0]}{!p.isAudioOn && <MicOff className="w-3 h-3 ml-1" />}{p.isHandRaised && <Hand className="w-3 h-3 ml-1 text-yellow-400" />}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-2 sm:p-4 border-t border-gray-700">
        <div className="flex justify-around items-center flex-wrap gap-2">
          <button onClick={() => setIsAudioOn(!isAudioOn)} className={`p-3 rounded-lg ${isAudioOn ? 'bg-gray-700' : 'bg-red-500'}`}><Mic className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-3 rounded-lg ${isVideoOn ? 'bg-gray-700' : 'bg-red-500'}`}><Video className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`p-3 rounded-lg ${isScreenSharing ? 'bg-blue-500' : 'bg-gray-700'}`}><Monitor className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <button className="p-3 rounded-lg bg-gray-700"><Hand className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <button onClick={() => setShowChat(true)} className={`p-3 rounded-lg ${showChat ? 'bg-cyan-500' : 'bg-gray-700'}`}><MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <button className="p-3 rounded-lg bg-gray-700"><Settings className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <button className="p-3 rounded-lg bg-red-500"><Phone className="w-5 h-5 sm:w-6 sm:h-6" /></button>
        </div>
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed inset-0 lg:inset-y-0 lg:right-0 lg:w-96 bg-gray-800 border-l border-gray-700 flex flex-col z-50">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Chat</h2>
              <button onClick={() => setShowChat(false)} className="p-1 hover:bg-gray-700 rounded"><X /></button>
            </div>
            <div className="flex space-x-1 bg-gray-700 rounded-lg p-1 mx-4">
              <button onClick={() => setActiveTab('students')} className={`flex-1 py-2 px-3 rounded-md text-sm ${activeTab === 'students' ? 'bg-cyan-500' : ''}`}>Students</button>
              <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 px-3 rounded-md text-sm ${activeTab === 'ai' ? 'bg-purple-500' : ''}`}>AI</button>
              <button onClick={() => setActiveTab('tutor')} className={`flex-1 py-2 px-3 rounded-md text-sm ${activeTab === 'tutor' ? 'bg-green-500' : ''}`}>Tutor</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{messages[activeTab].map(renderMessage)}<div ref={chatEndRef} /></div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={`Message...`} className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500" />
                <button onClick={handleSendMessage} className="p-2 bg-cyan-500 rounded-lg"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassroomMeeting;
