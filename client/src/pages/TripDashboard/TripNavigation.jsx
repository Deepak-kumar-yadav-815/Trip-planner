export default function TripNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-700">
      <div className="bg-card/40 backdrop-blur-3xl border border-white/20 shadow-2xl p-2 rounded-full flex items-center gap-1 md:gap-2">
        {[
          { id: 'details', label: 'Details', icon: <><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></> },
          { id: 'checkpoints', label: 'Itinerary', icon: <><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></> },
          { id: 'map', label: 'Map', icon: <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></> },
          { id: 'chat', label: 'Chat', icon: <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/> },
          { id: 'voice', label: 'Voice', icon: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></> },
          { id: 'expenses', label: 'Expenses', icon: <><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></> },
          { id: 'media', label: 'Media', icon: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></> },
          { id: 'notes', label: 'Notes', icon: <><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative group flex items-center gap-2 px-4 py-3 md:px-5 md:py-3.5 rounded-full font-bold text-sm transition-all duration-500 overflow-hidden ${isActive ? 'text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary w-full h-full animate-in zoom-in-95 duration-300" />
              )}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                {tab.icon}
              </svg>
              <span className={`relative z-10 transition-all duration-300 ${isActive ? 'max-w-[100px] opacity-100 ml-1' : 'max-w-0 opacity-0 overflow-hidden hidden md:block group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
