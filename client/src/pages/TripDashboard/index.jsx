import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import ExpensesTab from '../../components/ExpensesTab';
import MediaTab from '../../components/MediaTab';
import VoiceRoom from '../../components/VoiceRoom';
import ReactMarkdown from 'react-markdown';

import { useTripSocket } from './useTripSocket';
import TripNavigation from './TripNavigation';
import TripMap from './TripMap';
import TripChat from './TripChat';
import ItineraryList from './ItineraryList';
import TripNotes from './TripNotes';
import TripDetails from './TripDetails';

export default function TripDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  
  // Trip State
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [loadingSummary, setLoadingSummary] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isJournalExpanded, setIsJournalExpanded] = useState(true);
  
  // Status State
  const [memberStatuses, setMemberStatuses] = useState({});
  const [myCustomStatuses, setMyCustomStatuses] = useState([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [newCustomStatus, setNewCustomStatus] = useState('');
  
  // Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Map State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedPlace, setSearchedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Location Sharing State
  const [memberLocations, setMemberLocations] = useState({});
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  // Initialize Custom Socket Hook
  const { sendMessage, emitUpdateStatus, emitLocationUpdate, socket } = useTripSocket(id, setTrip, setMessages, setMemberStatuses, setMemberLocations);

  // Geolocation Effect
  useEffect(() => {
    let watchId;
    if (isSharingLocation) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Update my own location in state (using my user._id from the trip)
            const myDbId = trip?.members?.find(m => m.user.clerkId === user?.id)?.user._id;
            if (myDbId) {
              setMemberLocations(prev => ({ ...prev, [myDbId]: { lat: latitude, lng: longitude } }));
              emitLocationUpdate({ tripId: id, userId: myDbId, lat: latitude, lng: longitude });
            }
          },
          (error) => {
            console.error("Error watching location:", error);
            setIsSharingLocation(false);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      } else {
        alert("Geolocation is not supported by your browser");
        setIsSharingLocation(false);
      }
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isSharingLocation, trip, user, id]);

  useEffect(() => {
    fetchTripDetails();
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (trip?.checkpoints?.length > 0 && !searchedPlace) {
      const firstCp = trip.checkpoints[0].location;
      if (firstCp && firstCp.lat) {
        setMapCenter({ lat: firstCp.lat, lng: firstCp.lng });
      }
    }
    
    // Initialize Statuses
    if (trip && trip.members) {
      const statuses = {};
      trip.members.forEach(m => {
        statuses[m.user._id] = m.user.currentStatus || 'Fine';
      });
      setMemberStatuses(prev => ({ ...prev, ...statuses }));
      
      const me = trip.members.find(m => m.user.clerkId === user?.id);
      if (me && me.user.customStatuses) {
        setMyCustomStatuses(me.user.customStatuses);
      }
    }
  }, [trip, searchedPlace, user]);

  const fetchTripDetails = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrip(data);
      } else {
        setTrip(null);
      }
    } catch (err) {
      console.error(err);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeTrip = async () => {
    if (!window.confirm("Are you sure you want to finalize this trip? This will generate a final AI summary.")) return;
    setIsFinalizing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/finalize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrip(data);
      }
    } catch (err) { console.error(err); } finally {
      setIsFinalizing(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleSearchPlace = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveCheckpoint = async (checkpointId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/checkpoints/${checkpointId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTrip({ ...trip, checkpoints: trip.checkpoints.filter(cp => cp._id !== checkpointId) });
      }
    } catch (err) { console.error(err); }
  };

  const handleMarkVisited = async (checkpointId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/checkpoints/${checkpointId}/visit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrip({ ...trip, checkpoints: trip.checkpoints.map(cp => cp._id === checkpointId ? data : cp) });
      }
    } catch (err) { console.error(err); }
  };

  const handleReorderCheckpoint = async (checkpointId, direction) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/checkpoints/${checkpointId}/reorder`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });
      if (res.ok) {
        // optimistically update local state
        const index = trip.checkpoints.findIndex(cp => cp._id === checkpointId);
        if (index === -1) return;
        const newCheckpoints = [...trip.checkpoints];
        if (direction === 'up' && index > 0) {
          const temp = newCheckpoints[index - 1];
          newCheckpoints[index - 1] = newCheckpoints[index];
          newCheckpoints[index] = temp;
        } else if (direction === 'down' && index < newCheckpoints.length - 1) {
          const temp = newCheckpoints[index + 1];
          newCheckpoints[index + 1] = newCheckpoints[index];
          newCheckpoints[index] = temp;
        }
        setTrip({ ...trip, checkpoints: newCheckpoints });
      }
    } catch (err) { console.error(err); }
  };

  const handleAISearchPlace = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/checkpoints/explore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.map(p => ({
          display_name: `${p.name} - ${p.description}`,
          lat: p.lat,
          lon: p.lng,
          nameOnly: p.name
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async ({ name, lat, lon, category }) => {
    // 1. Instantly fly map to the selected location
    setMapCenter({ lat, lng: lon });
    setSearchedPlace({ name, lat, lng: lon });
    
    // 2. Fetch OpenTripMap POIs in the background
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/map/places`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lat, 
          lon, 
          kinds: category === 'interesting_places' ? [] : [category] 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.filter(p => p.name).map(p => ({
          display_name: `${p.name} (${p.kinds?.split(',')[0] || 'POI'})`,
          lat: p.point?.lat || p.lat,
          lon: p.point?.lon || p.lon,
          nameOnly: p.name
        })));
      }
    } catch (err) {
      console.error("OpenTripMap Fetch Error:", err);
    }
  };


  const selectPlace = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setSearchedPlace({ name: place.nameOnly || place.display_name.split(',')[0], lat, lng });
    setMapCenter({ lat, lng });
    // Don't clear searchResults so user can go back to the POI list
  };

  const handleAddCheckpointFromMap = async (placeToAdd) => {
    // If it's a React SyntheticEvent, treat it as null
    const actualPlaceToAdd = (placeToAdd && !placeToAdd.nativeEvent) ? placeToAdd : null;
    const targetPlace = actualPlaceToAdd || searchedPlace;
    if (!targetPlace) return;
    
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/checkpoints`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: targetPlace.name || targetPlace.nameOnly || targetPlace.display_name?.split(',')[0], 
          type: 'Point of Interest',
          location: { lat: targetPlace.lat, lng: targetPlace.lng || targetPlace.lon } 
        }) 
      });
      if (res.ok) {
        setTrip({ ...trip, checkpoints: [...trip.checkpoints, await res.json()] });
        setSearchedPlace(null);
        setActiveTab('checkpoints');
      }
    } catch (err) { console.error(err); }
  };

  const handleAISummary = async (checkpointId) => {
    setLoadingSummary(checkpointId);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${id}/checkpoints/${checkpointId}/summary`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrip({ ...trip, checkpoints: trip.checkpoints.map(cp => cp._id === checkpointId ? { ...cp, aiSummary: data.summary } : cp) });
      } else {
        alert("AI service error. Ensure GEMINI_API_KEY is correct in backend .env");
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoadingSummary(null);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messageData = { tripId: id, senderId: user.id, content: newMessage, type: 'text' };
    sendMessage(messageData);
    setNewMessage("");
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!newStatus.trim()) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/users/me/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.trim() })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setMyCustomStatuses(updatedUser.customStatuses || []);
        
        const myDbId = trip.members.find(m => m.user.clerkId === user.id)?.user._id;
        if (myDbId) {
          setMemberStatuses(prev => ({ ...prev, [myDbId]: newStatus.trim() }));
          emitUpdateStatus({ tripId: id, userId: myDbId, status: newStatus.trim() });
        }
        setIsStatusDropdownOpen(false);
        setNewCustomStatus('');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteCustomStatus = async (statusToDelete, e) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/users/me/custom-status`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusToDelete })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setMyCustomStatuses(updatedUser.customStatuses || []);
        const myDbId = trip.members.find(m => m.user.clerkId === user.id)?.user._id;
        if (myDbId && memberStatuses[myDbId] === statusToDelete) {
           setMemberStatuses(prev => ({ ...prev, [myDbId]: 'Fine' }));
           emitUpdateStatus({ tripId: id, userId: myDbId, status: 'Fine' });
        }
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]"><div className="animate-pulse font-medium text-lg">Loading trip details...</div></div>;
  if (!trip) return <div className="p-8 text-center text-red-500 font-semibold">Trip not found or unauthorized.</div>;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden relative bg-background">
      
      {/* Floating Bottom Dock - Main Navigation */}
      <TripNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Edge-to-Edge Main Content Area */}
      <div className="flex-1 h-full w-full relative z-0">
        
        {/* Map */}
        <TripMap 
          trip={trip}
          activeTab={activeTab}
          mapCenter={mapCenter}
          searchedPlace={searchedPlace}
          setSearchedPlace={setSearchedPlace}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearching={isSearching}
          handleSearchPlace={handleSearchPlace}
          handleAISearchPlace={handleAISearchPlace}
          handleLocationSelect={handleLocationSelect}
          selectPlace={selectPlace}
          handleAddCheckpointFromMap={handleAddCheckpointFromMap}
          memberLocations={memberLocations}
          isSharingLocation={isSharingLocation}
          setIsSharingLocation={setIsSharingLocation}
        />

        {/* Other Tabs Content Area (Padded to account for floating elements) */}
        {activeTab !== 'map' && activeTab !== 'voice' && (
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pt-12 pb-32 px-4 md:px-8 flex flex-col items-center bg-muted/10">
            <div className="max-w-4xl w-full space-y-8 animate-in fade-in zoom-in-[0.98] duration-500">
          
              {trip.status === 'completed' && activeTab === 'checkpoints' && trip.aiSummary && (
                <div className="bg-card text-card-foreground shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-border/50 rounded-3xl p-8 mb-6 mt-4 relative overflow-hidden group transition-all">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 m-0 leading-tight">AI Trip Journal</h3>
                        <p className="text-sm text-muted-foreground m-0 mt-0.5 font-medium">A magical summary of your journey</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsJournalExpanded(!isJournalExpanded)}
                      className="p-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isJournalExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  
                  {isJournalExpanded && (
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-semibold mt-8 animate-in fade-in duration-300">
                      <ReactMarkdown>{trip.aiSummary}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <TripDetails 
                  trip={trip}
                  memberStatuses={memberStatuses}
                  isStatusDropdownOpen={isStatusDropdownOpen}
                  setIsStatusDropdownOpen={setIsStatusDropdownOpen}
                  myCustomStatuses={myCustomStatuses}
                  handleUpdateStatus={handleUpdateStatus}
                  handleDeleteCustomStatus={handleDeleteCustomStatus}
                  newCustomStatus={newCustomStatus}
                  setNewCustomStatus={setNewCustomStatus}
                  handleFinalizeTrip={handleFinalizeTrip}
                  isFinalizing={isFinalizing}
                />
              )}

              <ItineraryList 
                trip={trip}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleRemoveCheckpoint={handleRemoveCheckpoint}
                handleMarkVisited={handleMarkVisited}
                handleReorderCheckpoint={handleReorderCheckpoint}
                handleAISummary={handleAISummary}
                loadingSummary={loadingSummary}
              />

              <TripChat 
                activeTab={activeTab}
                messages={messages}
                messagesEndRef={messagesEndRef}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                user={user}
              />

              {activeTab === 'notes' && (
                <TripNotes 
                  tripId={id} 
                  activeTab={activeTab} 
                  user={user} 
                  socket={socket} 
                  trip={trip} 
                />
              )}

              {activeTab === 'media' && <MediaTab tripId={id} />}
              {activeTab === 'expenses' && <ExpensesTab tripId={id} members={trip.members} tripName={trip.title} />}
            </div>
          </div>
        )}
        
        {/* Voice Room Container (Always mounted, manages its own visibility) */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          <VoiceRoom tripId={id} isActive={activeTab === 'voice'} />
        </div>
      </div>
    </div>
  );
}
