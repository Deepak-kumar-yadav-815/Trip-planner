import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';

export default function TripDetails({ 
  trip, 
  memberStatuses, 
  isStatusDropdownOpen, 
  setIsStatusDropdownOpen, 
  myCustomStatuses, 
  handleUpdateStatus, 
  handleDeleteCustomStatus, 
  newCustomStatus, 
  setNewCustomStatus, 
  handleFinalizeTrip, 
  isFinalizing 
}) {
  const { userId } = useAuth();
  const [isJournalExpanded, setIsJournalExpanded] = useState(true);

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar p-4 md:p-8 pt-12 pb-40 animate-in fade-in duration-700 bg-background relative">
      
      {/* Ambient Background Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Hero Section */}
        <div className="relative text-center space-y-6 py-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md shadow-[0_0_20px_rgba(var(--primary),0.15)] mb-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Active Journey</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 drop-shadow-sm animate-in zoom-in-95 fade-in duration-700 delay-100">
            {trip.title}
          </h1>
          
          <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
            {new Date(trip.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
            <div className="inline-flex flex-col items-center p-4 bg-card/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Invite Code</span>
              <div className="text-2xl md:text-3xl font-mono font-bold tracking-[0.2em] text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                {trip.joinId}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Glass Bar */}
        <div className="relative z-50 max-w-2xl mx-auto bg-card/60 backdrop-blur-3xl border border-white/20 shadow-2xl rounded-3xl p-3 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
          
          {/* Status Dropdown */}
          <div className="relative w-full md:w-auto">
            <button 
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="w-full md:w-auto px-6 py-4 bg-background/50 hover:bg-background/80 border border-border/50 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md group"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-20 group-hover:animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              </div>
              Update Status
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 mt-3 w-full md:w-72 bg-card/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  {['Fine', 'Taking a break', 'Running late', 'Need help'].map(status => (
                    <button 
                      key={status}
                      onClick={() => { handleUpdateStatus(status); setIsStatusDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-primary/10 hover:text-primary rounded-xl transition-colors font-semibold"
                    >
                      {status}
                    </button>
                  ))}
                  
                  {myCustomStatuses.length > 0 && <div className="h-px bg-border/50 mx-2 my-2" />}
                  {myCustomStatuses.map(status => (
                    <div key={status} className="group flex justify-between items-center px-4 py-2 hover:bg-primary/10 rounded-xl transition-colors">
                      <button 
                        onClick={() => { handleUpdateStatus(status); setIsStatusDropdownOpen(false); }}
                        className="text-sm font-semibold flex-1 text-left group-hover:text-primary"
                      >
                        {status}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustomStatus(status); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  
                  <div className="h-px bg-border/50 mx-2 my-2" />
                  <div className="px-2 pb-1 pt-1">
                    <input
                      type="text"
                      placeholder="Type custom status..."
                      value={newCustomStatus}
                      onChange={(e) => setNewCustomStatus(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCustomStatus.trim()) {
                          handleUpdateStatus(newCustomStatus.trim());
                          setNewCustomStatus('');
                          setIsStatusDropdownOpen(false);
                        }
                      }}
                      className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none font-medium placeholder:text-muted-foreground/70 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Finalize Trip Button */}
          <button 
            onClick={handleFinalizeTrip}
            disabled={isFinalizing || trip.status === 'completed'}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] rounded-2xl text-sm font-bold transition-all disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 group overflow-hidden relative"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
            
            <span className="relative flex items-center gap-2">
              {isFinalizing ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  Generating Magic...
                </>
              ) : trip.status === 'completed' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  Trip Concluded
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                  Finalize Trip
                </>
              )}
            </span>
          </button>
        </div>

        {/* AI Summary Card */}
        {trip.aiSummary && (
          <div className="relative group animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
            <div className="relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h20"/><path d="m17.66 12.34 1.41-1.41"/><path d="M11 22v-4h2v4z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">AI Trip Journal</h3>
                    <p className="text-sm text-muted-foreground font-medium">A magical summary of your journey</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsJournalExpanded(!isJournalExpanded)}
                  className="p-2 bg-background/50 hover:bg-background/80 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isJournalExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                </button>
              </div>
              
              {isJournalExpanded && (
                <div className="prose prose-invert max-w-none mt-8 animate-in fade-in duration-300 prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-semibold">
                  <ReactMarkdown>{trip.aiSummary}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members Grid */}
        <div className="pt-8 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              Travelers
            </h2>
            <div className="text-sm font-bold text-muted-foreground bg-muted px-4 py-1.5 rounded-full">
              {trip.members.length} Total
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trip.members.map((member, index) => (
              <div 
                key={member.user._id} 
                className="group relative bg-card/40 hover:bg-card backdrop-blur-xl border border-white/5 hover:border-primary/30 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(var(--primary),0.1)] overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glowing Hover Effect Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex items-start gap-5">
                  <div className="relative">
                    <img 
                      src={member.user.avatar || 'https://via.placeholder.com/150'} 
                      alt={member.user.name} 
                      className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Status Dot */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{member.user.name}</h3>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      {member.role === 'admin' && (
                        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-widest border border-primary/20">
                          Admin
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="text-sm font-medium text-muted-foreground truncate group-hover:text-foreground transition-colors">
                          {memberStatuses[member.user._id] || 'Exploring'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
