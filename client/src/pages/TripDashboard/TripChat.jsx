import React, { useState } from 'react';
import AIChatbox from './AIChatbox';

export default function TripChat({
  activeTab,
  messages,
  messagesEndRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
  user
}) {
  const [showAIChat, setShowAIChat] = useState(false);

  if (activeTab !== 'chat') return null;

  return (
    <div className="flex flex-col rounded-3xl bg-card border border-border/50 overflow-hidden min-h-[600px] shadow-sm relative">
      <div className="p-6 border-b bg-card/50 backdrop-blur flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          Trip Chat
        </h2>
        
        {/* AI Chat Button */}
        <button 
          onClick={() => setShowAIChat(!showAIChat)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${showAIChat ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
          AI Agent
        </button>
      </div>
      
      {/* WhatsApp Floating Chatbox */}
      {showAIChat && <AIChatbox tripId={messages[0]?.tripId || window.location.pathname.split('/').pop()} onClose={() => setShowAIChat(false)} />}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {messages.length === 0 && <div className="text-center text-muted-foreground mt-10">No messages yet. Say hi!</div>}
        {messages.map((msg, i) => {
          const isMe = msg.sender?.clerkId === user.id || msg.sender === user.id || msg.senderId === user.id;
          const senderName = msg.sender?.name || "Unknown";
          const senderAvatar = msg.sender?.avatar || "https://via.placeholder.com/32";
          
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                <img src={senderAvatar} alt="avatar" className="w-8 h-8 rounded-full border shadow-sm mb-1 object-cover" />
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 ${isMe ? 'text-right' : 'text-left'}`}>{senderName}</span>
                  <div className={`px-5 py-3 rounded-2xl max-w-[260px] sm:max-w-sm lg:max-w-md shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted/80 text-foreground rounded-bl-sm'}`}>
                    <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1.5 px-11">{new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-muted/20 border-t flex gap-3">
        <input type="text" placeholder="Type a message..." className="flex-1 bg-background border-2 border-transparent focus:border-primary/50 rounded-full px-5 py-3 text-sm focus:outline-none transition-colors shadow-sm" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center hover:scale-105 hover:shadow-lg hover:shadow-primary/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  );
}
