import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';

export default function AIChatbox({ tripId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { getToken } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Initial welcome message
    setMessages([
      { role: 'assistant', content: 'Hi there! 👋 I am your AI Trip Assistant. Ask me anything about your trip or destinations!' }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        const errorData = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: `Oops! Something went wrong: ${errorData.error || 'Server error'}` }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute z-[2000] bottom-20 right-6 w-80 md:w-96 h-[500px] flex flex-col bg-[#efeae2] border border-border/50 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
      
      {/* WhatsApp-style Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] text-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-sm overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] leading-tight">AI Agent</span>
            <span className="text-[11px] text-white/80 leading-tight">Online</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* WhatsApp-style Chat Body (Wallpaper background simulation) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ backgroundImage: 'radial-gradient(#00000010 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {messages.map((msg, i) => {
          const isMe = msg.role === 'user';
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`relative px-3 py-2 text-[14px] leading-snug max-w-[85%] shadow-sm ${
                  isMe 
                    ? 'bg-[#dcf8c6] text-black rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-none' 
                    : 'bg-white text-black rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-none'
                }`}
              >
                {/* Tail styling for realistic bubbles */}
                <div className={`absolute top-0 w-3 h-3 ${isMe ? '-right-1.5 bg-[#dcf8c6]' : '-left-1.5 bg-white'}`} style={{ clipPath: isMe ? 'polygon(0 0, 0% 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' }}></div>
                
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-black">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="relative px-4 py-3 bg-white text-black rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-none shadow-sm flex gap-1 items-center">
              <div className="absolute top-0 w-3 h-3 -left-1.5 bg-white" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}></div>
              <span className="w-2 h-2 rounded-full bg-black/40 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-black/40 animate-bounce delay-75"></span>
              <span className="w-2 h-2 rounded-full bg-black/40 animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Input */}
      <form onSubmit={handleSend} className="p-2 bg-[#f0f0f0] flex items-end gap-2">
        <div className="flex-1 bg-white rounded-full flex items-center shadow-sm">
          <input 
            type="text" 
            placeholder="Message AI Agent..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full bg-transparent px-5 py-3 text-[15px] focus:outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="w-12 h-12 flex-shrink-0 bg-[#128C7E] text-white rounded-full flex items-center justify-center hover:bg-[#075e54] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  );
}
