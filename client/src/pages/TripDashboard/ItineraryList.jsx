import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// Icons for different place types
const getTypeIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('hotel') || t.includes('lodging')) return <path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M8 14v6M16 14v6" />;
  if (t.includes('restaurant') || t.includes('food')) return <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 2v20M21 7h-4a2 2 0 0 1-2-2V2M21 11h-4" />;
  if (t.includes('airport') || t.includes('flight')) return <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l5 5-3 3-3-.5L1 17l4 2 2 4 .5-1-1.5-3 3-3 5 5 1.2-1.8c.4-.2.7-.6.6-1.1L11 16l8.2-1.8c1.5-1.5 2-3.5 1.5-4.5-.5-1-2.5-.5-4.5 1.5l-3.5 3.5" />;
  return <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />; // Default Map Pin
};

const getGradientForType = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('hotel') || t.includes('lodging')) return 'from-blue-500 to-indigo-600';
  if (t.includes('restaurant') || t.includes('food')) return 'from-orange-500 to-red-600';
  if (t.includes('airport') || t.includes('flight')) return 'from-cyan-500 to-blue-600';
  return 'from-primary to-purple-600';
};

function CheckpointCard({ cp, index, isLast, handleRemoveCheckpoint, handleReorderCheckpoint, handleMarkVisited, handleAISummary, loadingSummary }) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const typeGradient = getGradientForType(cp.type);

  return (
    <div className="relative pl-12 md:pl-16 group">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[1.125rem] md:left-[1.625rem] top-14 bottom-0 w-0.5 bg-gradient-to-b from-border to-transparent group-hover:from-primary/30 transition-colors"></div>
      )}

      {/* Timeline Node */}
      <div className={`absolute left-0 md:left-2 top-4 w-10 h-10 rounded-full bg-gradient-to-br ${typeGradient} shadow-lg flex items-center justify-center text-white z-10 transform transition-transform group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {getTypeIcon(cp.type)}
          {(!cp.type || (!cp.type.includes('hotel') && !cp.type.includes('restaurant') && !cp.type.includes('airport'))) && (
            <circle cx="12" cy="10" r="3"/>
          )}
        </svg>
      </div>

      {/* Card Content */}
      <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all mb-8 relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${typeGradient} opacity-5 blur-3xl rounded-full`}></div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${typeGradient} text-white shadow-sm`}>
                {cp.type || 'Destination'}
              </span>
            </div>
            <h3 className="font-black text-2xl tracking-tight mb-1 group-hover:text-primary transition-colors">{cp.name}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!cp.aiSummary || cp.aiSummary.includes("unavailable due to AI service issue") ? (
              <button 
                onClick={() => handleAISummary(cp._id)} 
                disabled={loadingSummary === cp._id}
                className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {loadingSummary === cp._id ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
                    {cp.aiSummary ? 'Retry Insights' : 'Get Insights'}
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${isSummaryExpanded ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
                {isSummaryExpanded ? 'Hide Insights' : 'View Insights'}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isSummaryExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
              </button>
            )}
            
            {index > 0 && (
              <button onClick={() => handleReorderCheckpoint(cp._id, 'up')} className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl transition-colors" title="Move Up">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              </button>
            )}

            {!isLast && (
              <button onClick={() => handleReorderCheckpoint(cp._id, 'down')} className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl transition-colors" title="Move Down">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            )}

            <button 
              onClick={() => handleMarkVisited(cp._id)} 
              disabled={cp.visitedBy && cp.visitedBy.length > 0}
              className={`p-2 rounded-xl transition-colors ${cp.visitedBy && cp.visitedBy.length > 0 ? 'bg-green-500/20 text-green-500 cursor-not-allowed' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`} 
              title={cp.visitedBy && cp.visitedBy.length > 0 ? "Visited" : "Mark Visited"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {cp.visitedBy && cp.visitedBy.length > 0 ? (
                  <path d="M20 6 9 17l-5-5"/>
                ) : (
                  <path d="M20 6 9 17l-5-5"/>
                )}
              </svg>
            </button>

            <button onClick={() => handleRemoveCheckpoint(cp._id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Remove">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        {/* Expandable AI Summary */}
        <div className={`grid transition-all duration-500 ease-in-out ${isSummaryExpanded && cp.aiSummary ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-5 md:p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-500 rounded-l-2xl"></div>
              <h4 className="font-bold text-primary flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h20"/><path d="m17.66 12.34 1.41-1.41"/><path d="M11 22v-4h2v4z"/></svg>
                AI Insights & Recommendations
              </h4>
              <div className="text-sm leading-relaxed text-foreground/90 font-medium prose prose-sm prose-p:my-2 prose-strong:text-primary max-w-none">
                <ReactMarkdown>{cp.aiSummary}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryList({
  trip,
  activeTab,
  setActiveTab,
  handleRemoveCheckpoint,
  handleReorderCheckpoint,
  handleMarkVisited,
  handleAISummary,
  loadingSummary
}) {
  if (activeTab !== 'checkpoints') return null;

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar bg-background animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-12 pb-40">
        
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground drop-shadow-sm mb-4">
            Journey Timeline
          </h2>
          <p className="text-muted-foreground font-medium max-w-lg mx-auto">
            Your planned destinations and AI-curated insights.
          </p>
        </div>

        <div className="relative py-4">
          {trip.checkpoints && trip.checkpoints.length > 0 ? (
            <div className="space-y-2 relative">
              {trip.checkpoints.map((cp, index) => (
                <div key={cp._id} className="animate-in slide-in-from-bottom-8 fade-in duration-700" style={{ animationDelay: `${index * 150}ms` }}>
                  <CheckpointCard 
                    cp={cp} 
                    index={index}
                    isLast={index === trip.checkpoints.length - 1}
                    handleRemoveCheckpoint={handleRemoveCheckpoint}
                    handleReorderCheckpoint={handleReorderCheckpoint}
                    handleMarkVisited={handleMarkVisited}
                    handleAISummary={handleAISummary}
                    loadingSummary={loadingSummary}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-in zoom-in-95 duration-700">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Your canvas is empty</h3>
              <p className="text-muted-foreground font-medium mb-8">Start building your itinerary by adding destinations from the map.</p>
            </div>
          )}

          {/* Add Node Button */}
          <div className="relative pl-12 md:pl-16 mt-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500">
            {trip.checkpoints && trip.checkpoints.length > 0 && (
              <div className="absolute left-[1.125rem] md:left-[1.625rem] top-0 -mt-12 h-12 w-0.5 bg-gradient-to-b from-border to-transparent"></div>
            )}
            
            <button 
              onClick={() => setActiveTab('map')}
              className="group relative w-full overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300 p-6 flex flex-col items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              <span className="font-bold text-lg group-hover:text-primary transition-colors">Add New Destination</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
