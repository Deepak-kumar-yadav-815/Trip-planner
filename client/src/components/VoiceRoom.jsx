import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { LiveKitRoom, RoomAudioRenderer, useParticipants, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';

const ActiveCallUI = ({ setIsConnected }) => {
  const participants = useParticipants();
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

  const toggleMic = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    }
  };

  return (
    <div className="fixed top-24 right-4 sm:right-8 w-72 sm:w-80 bg-zinc-950/80 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden z-[100] animate-in slide-in-from-right-8 fade-in text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Ongoing Call</span>
          <span className="text-sm font-medium text-white/90">{participants.length} Participant{participants.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
        </span>
      </div>

      {/* Participants Grid / List */}
      <div className="p-6 max-h-[40vh] overflow-y-auto custom-scrollbar space-y-5 flex-1">
        {participants.length === 0 && (
          <div className="text-center text-white/40 text-sm py-8 animate-pulse">Waiting for others to join...</div>
        )}
        {participants.map(p => {
          // Try to parse avatar from metadata, fallback to initial
          let avatarUrl = null;
          try {
            if (p.metadata) {
              const meta = JSON.parse(p.metadata);
              avatarUrl = meta.avatar;
            }
          } catch(e) {}

          return (
            <div key={p.identity} className="flex items-center gap-4 transition-all duration-300">
              <div className={`relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${p.isSpeaking ? 'ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-110' : 'ring-1 ring-white/10'}`}>
                 {avatarUrl ? (
                   <img src={avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-white/5 flex items-center justify-center font-bold text-lg text-white/80">
                     {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                   </div>
                 )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className={`font-semibold text-sm truncate transition-colors duration-300 ${p.isSpeaking ? 'text-green-400' : 'text-white/90'}`}>{p.name || p.identity}</h4>
                <p className="text-[11px] text-white/40 font-medium tracking-wide">{p.isSpeaking ? 'Speaking...' : 'Listening'}</p>
              </div>
              {/* Mic Status Icon */}
              <div className="text-white/20">
                {!p.isMicrophoneEnabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={p.isSpeaking ? "text-green-400" : ""}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="bg-white/5 p-6 flex justify-center items-center gap-8 border-t border-white/5">
        <button 
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMicrophoneEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/90 hover:bg-white text-black'}`}
        >
          {isMicrophoneEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          )}
        </button>
        
        <button 
          onClick={() => setIsConnected(false)}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="22" x2="2" y1="2" y2="22"/></svg>
        </button>
      </div>
    </div>
  );
};

const VoiceRoom = ({ tripId, isActive }) => {
  const { getToken } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

  const handleJoin = async () => {
    try {
      const authToken = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const res = await fetch(`${API_URL}/trips/${tripId}/voice/token`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch voice token. Have you added LiveKit API keys to your backend?');
      }
      
      const data = await res.json();
      setToken(data.token);
      setIsConnected(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (!LIVEKIT_URL) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-background">
        <div className="p-8 max-w-md w-full border rounded-2xl bg-muted/20 text-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-muted-foreground opacity-50"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
          <h2 className="text-xl font-bold mb-2">Voice Chat Disabled</h2>
          <p className="text-sm text-muted-foreground mb-4">You need to configure the LiveKit integration to use this feature.</p>
          <div className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-lg text-left font-mono">
            Add <span className="text-primary">VITE_LIVEKIT_URL</span> to your client .env file to enable.
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    if (!isActive) return null; // Only show join UI if the Voice tab is explicitly active

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-background pointer-events-auto">
        <div className="max-w-md w-full p-8 border border-dashed rounded-[2.5rem] bg-card flex flex-col items-center text-center space-y-6 shadow-sm">
          <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(var(--primary),0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Trip Voice Channel</h2>
            <p className="text-muted-foreground mt-2 font-medium">Coordinate with your group in real-time, hands-free.</p>
          </div>
          <button 
            onClick={handleJoin} 
            className="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-all hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Join Voice Chat
          </button>
          {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg w-full font-medium">{error}</p>}
        </div>
      </div>
    );
  }

  // When connected, we return ONLY the LiveKit room with our floating ActiveCallUI.
  // We do NOT return the tab background, so the floating window floats above whatever activeTab is selected in TripDashboard!
  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={token}
      connect={true}
      className="fixed inset-0 pointer-events-none z-50" // pointer-events-none ensures it doesn't block clicks to the app below it
      onDisconnected={() => setIsConnected(false)}
    >
      {/* Restore pointer events only for the actual phone UI */}
      <div className="pointer-events-auto">
        <ActiveCallUI setIsConnected={setIsConnected} />
      </div>
      {/* RoomAudioRenderer is invisible but plays the audio */}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

export default VoiceRoom;
