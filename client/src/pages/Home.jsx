import { useUser, useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / forms state
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: '', description: '', startDate: '' });
  
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const token = await getToken();
      
      // First, sync user to ensure they exist in DB
      await fetch(`${API_URL}/users/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress,
          avatar: user?.imageUrl
        })
      });

      // Then fetch trips
      const res = await fetch(`${API_URL}/trips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createData)
      });
      if (res.ok) {
        const newTrip = await res.json();
        setTrips([newTrip, ...trips]);
        setShowCreate(false);
        navigate(`/trip/${newTrip._id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ joinId })
      });
      if (res.ok) {
        const joinedTrip = await res.json();
        setTrips([joinedTrip, ...trips]);
        setShowJoin(false);
        navigate(`/trip/${joinedTrip._id}`);
      } else {
        alert("Failed to join trip. Check the code and try again.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background">
      {/* Left Pane - Command Center (Sticky) */}
      <div className="lg:w-[400px] xl:w-[450px] shrink-0 border-b lg:border-b-0 lg:border-r border-border/50 bg-card/30 backdrop-blur-3xl overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
        <div className="p-8 space-y-8 flex-1 animate-in fade-in slide-in-from-left-4 duration-700">
          
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-primary via-purple-500 to-blue-500 pb-1">
              Hello, {user?.firstName || 'Traveler'}.
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg font-medium leading-relaxed">
              Your command center for upcoming adventures. Where to next?
            </p>
          </div>

          <div className="space-y-4">
            {/* Create Trip Action */}
            <div className={`group rounded-3xl border bg-background shadow-sm transition-all duration-500 overflow-hidden ${showCreate ? 'ring-2 ring-primary/50 shadow-md' : 'hover:border-primary/40 hover:shadow-md cursor-pointer'}`} onClick={() => !showCreate && setShowCreate(true)}>
              {showCreate ? (
                <form onSubmit={handleCreate} className="p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <h3 className="font-bold text-xl text-primary flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Create New Trip
                  </h3>
                  <input required type="text" placeholder="Destination or Title" className="border-b-2 border-transparent bg-muted/50 px-4 py-3 rounded-t-xl focus:border-primary focus:outline-none transition-colors font-medium text-sm" value={createData.title} onChange={e => setCreateData({...createData, title: e.target.value})} />
                  <input required type="text" placeholder="Short Description" className="border-b-2 border-transparent bg-muted/50 px-4 py-3 rounded-t-xl focus:border-primary focus:outline-none transition-colors text-sm" value={createData.description} onChange={e => setCreateData({...createData, description: e.target.value})} />
                  <input required type="date" className="border-b-2 border-transparent bg-muted/50 px-4 py-3 rounded-t-xl focus:border-primary focus:outline-none transition-colors text-sm text-foreground" value={createData.startDate} onChange={e => setCreateData({...createData, startDate: e.target.value})} />
                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowCreate(false); }} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-bold hover:bg-secondary/80 transition-colors text-sm">Cancel</button>
                    <button type="submit" className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30 text-sm">Create</button>
                  </div>
                </form>
              ) : (
                <div className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground text-primary transition-colors duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Create a Trip</h3>
                    <p className="text-sm text-muted-foreground">Start a brand new journey.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Join Trip Action */}
            <div className={`group rounded-3xl border bg-background shadow-sm transition-all duration-500 overflow-hidden ${showJoin ? 'ring-2 ring-secondary shadow-md' : 'hover:border-secondary/50 hover:shadow-md cursor-pointer'}`} onClick={() => !showJoin && setShowJoin(true)}>
              {showJoin ? (
                <form onSubmit={handleJoin} className="p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Join a Trip
                  </h3>
                  <input required type="text" placeholder="Enter Join Code" className="border-b-2 border-transparent bg-muted/50 px-4 py-4 rounded-t-xl focus:border-secondary focus:outline-none transition-colors uppercase font-mono tracking-widest font-bold text-center text-lg" value={joinId} onChange={e => setJoinId(e.target.value)} />
                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowJoin(false); }} className="flex-1 bg-secondary/50 text-foreground py-3 rounded-xl font-bold hover:bg-secondary transition-colors text-sm">Cancel</button>
                    <button type="submit" className="flex-1 bg-foreground text-background py-3 rounded-xl font-bold hover:bg-foreground/90 transition-all hover:shadow-lg text-sm">Join</button>
                  </div>
                </form>
              ) : (
                <div className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-secondary/30 rounded-2xl group-hover:bg-foreground group-hover:text-background text-foreground transition-colors duration-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Join a Trip</h3>
                    <p className="text-sm text-muted-foreground">Got an invite code? Enter here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Trip Canvas (Scrollable) */}
      <div className="flex-1 overflow-y-auto bg-muted/10 custom-scrollbar relative p-4 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-backwards">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight">Your Trips</h2>
            <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">{trips.length} Total</span>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-3xl border bg-card p-6 h-48 animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-1/3 h-4 bg-muted rounded-md" />
                    <div className="w-3/4 h-8 bg-muted rounded-md" />
                  </div>
                  <div className="flex justify-between mt-auto">
                    <div className="w-1/4 h-6 bg-muted rounded-full" />
                    <div className="w-1/4 h-6 bg-muted rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : trips.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
              {trips.map((trip, idx) => {
                const isCompleted = trip.status === 'completed';
                return (
                  <div 
                    key={trip._id} 
                    onClick={() => navigate(`/trip/${trip._id}`)} 
                    className={`group cursor-pointer relative flex flex-col rounded-3xl bg-card overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ${isCompleted ? 'border border-green-500/20 shadow-sm' : 'border border-border shadow-md hover:border-primary/40'}`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Top Accent Bar */}
                    <div className={`h-2 w-full ${isCompleted ? 'bg-green-500/50' : 'bg-gradient-to-r from-primary via-purple-500 to-blue-500'}`} />
                    
                    <div className="p-6 flex-1 flex flex-col bg-card/40 backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                          {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${isCompleted ? 'bg-green-100 text-green-700 border-green-200 shadow-sm' : 'bg-primary/10 text-primary border-primary/20 shadow-sm'}`}>
                          {trip.status}
                        </span>
                      </div>
                      
                      <h3 className={`text-2xl font-extrabold mb-2 leading-tight transition-colors duration-300 ${isCompleted ? 'group-hover:text-green-600' : 'group-hover:text-primary'}`}>
                        {trip.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-6">
                        {trip.description}
                      </p>
                      
                      <div className="mt-auto pt-5 border-t border-dashed flex justify-between items-center">
                        <div className="flex -space-x-2">
                          {/* Avatar stack visual trick */}
                          <div className="w-8 h-8 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary z-20">{(trip.members[0]?.user?.name || 'A')[0]}</div>
                          {trip.members.length > 1 && (
                            <div className="w-8 h-8 rounded-full border-2 border-card bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-600 z-10">{(trip.members[1]?.user?.name || 'B')[0]}</div>
                          )}
                          {trip.members.length > 2 && (
                            <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground z-0">+{trip.members.length - 2}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Join Code</span>
                          <span className="font-mono font-bold text-sm bg-muted/50 px-3 py-1 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {trip.joinId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center flex flex-col items-center justify-center space-y-6 bg-muted/5">
              <div className="p-6 bg-muted/50 rounded-full animate-bounce duration-1000">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-bold">Your canvas is blank</h3>
                <p className="text-lg text-muted-foreground">
                  You haven't planned any trips yet. Use the command center on the left to create or join your first adventure!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
