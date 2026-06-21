import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import PlaceSearchBar from './PlaceSearchBar';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom hook to center map dynamically
function MapCenterer({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Custom hook to auto-fit bounds based on visible markers
function MapBoundsFitter({ checkpoints, memberLocations, mapViewFilter }) {
  const map = useMap();
  
  useEffect(() => {
    const points = [];
    
    if (mapViewFilter === 'all' || mapViewFilter === 'checkpoints') {
      if (checkpoints) {
        checkpoints.forEach(cp => {
          if (cp.location && cp.location.lat) {
            points.push([cp.location.lat, cp.location.lng]);
          }
        });
      }
    }
    
    if (mapViewFilter === 'all' || mapViewFilter === 'friends') {
      if (memberLocations) {
        Object.values(memberLocations).forEach(loc => {
          if (loc && loc.lat) {
            points.push([loc.lat, loc.lng]);
          }
        });
      }
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16, animate: true });
    }
  }, [checkpoints, memberLocations, mapViewFilter, map]);
  
  return null;
}

export default function TripMap({
  trip,
  activeTab,
  mapCenter,
  searchedPlace,
  setSearchedPlace,
  searchResults,
  setSearchResults,
  searchQuery,
  setSearchQuery,
  isSearching,
  handleSearchPlace,
  handleAISearchPlace,
  handleLocationSelect,
  selectPlace,
  handleAddCheckpointFromMap,
  memberLocations,
  isSharingLocation,
  setIsSharingLocation
}) {
  const [mapViewFilter, setMapViewFilter] = useState('all'); // 'all', 'checkpoints', 'friends'
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const handleNavigateToLocation = (loc) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank');
  };

  const handleFlyTo = (lat, lng) => {
    if (mapInstance) {
      mapInstance.flyTo([lat, lng], 16, { animate: true });
    }
  };

  if (activeTab !== 'map') return null;

  return (
    <div className="absolute inset-0 z-0 animate-in fade-in duration-500">
      {/* Top Left Search Icon (Collapsed State) */}
      {!isSearchExpanded && (
        <div className="absolute top-28 left-6 z-[1000] flex justify-start pointer-events-auto">
          <button 
            onClick={() => setIsSearchExpanded(true)}
            className="w-14 h-14 bg-card/90 backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.1)] rounded-full flex items-center justify-center hover:scale-105 hover:bg-card transition-all group"
            title="Search Places"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground group-hover:text-primary transition-colors"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </div>
      )}

      {/* Top Center Search Bar (Expanded State) */}
      {isSearchExpanded && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[1050] flex justify-center pointer-events-auto">
          <PlaceSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLocationSelect={handleLocationSelect}
            isSearchingAI={isSearching}
            handleAISearchPlace={() => handleAISearchPlace()}
            onClose={() => setIsSearchExpanded(false)}
          />
        </div>
      )}

      {/* Map Directory (Sidebar List) */}
      <div className={`absolute top-44 left-6 z-[1000] flex flex-col bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 ${isDirectoryOpen ? 'w-64 opacity-100' : 'w-14 h-14 opacity-90 hover:opacity-100'}`}>
        {/* Header / Toggle */}
        <button 
          onClick={() => setIsDirectoryOpen(!isDirectoryOpen)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors h-14"
        >
          {isDirectoryOpen ? (
            <span className="font-bold text-sm">Directory</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
          )}
          {isDirectoryOpen && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>}
        </button>

        {/* Content */}
        {isDirectoryOpen && (
          <div className="flex-1 overflow-y-auto max-h-[60vh] p-3 pt-0 custom-scrollbar space-y-4">
            
            {/* Checkpoints Section */}
            {trip.checkpoints && trip.checkpoints.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Checkpoints</h4>
                <div className="space-y-1.5">
                  {trip.checkpoints.map(cp => cp.location?.lat && (
                    <button 
                      key={cp._id}
                      onClick={() => handleFlyTo(cp.location.lat, cp.location.lng)}
                      className="w-full text-left p-2 rounded-xl hover:bg-primary/10 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span className="truncate">{cp.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Friends Section */}
            {Object.keys(memberLocations || {}).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Friends Online</h4>
                <div className="space-y-1.5">
                  {Object.entries(memberLocations || {}).map(([userId, loc]) => {
                    const member = trip.members.find(m => m.user._id === userId);
                    if (!member || !loc?.lat) return null;
                    return (
                      <button 
                        key={userId}
                        onClick={() => handleFlyTo(loc.lat, loc.lng)}
                        className="w-full text-left p-2 rounded-xl hover:bg-primary/10 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-primary/20 flex-shrink-0">
                          <img src={member.user.avatar || 'https://via.placeholder.com/32'} className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate">{member.user.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto animate-pulse"></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {(!trip.checkpoints?.length) && Object.keys(memberLocations || {}).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No locations to show.</p>
            )}
          </div>
        )}
      </div>

      <MapContainer ref={setMapInstance} center={[mapCenter.lat, mapCenter.lng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapCenterer center={mapCenter} />
        <MapBoundsFitter checkpoints={trip.checkpoints} memberLocations={memberLocations} mapViewFilter={mapViewFilter} />
        
        {/* Existing Checkpoints */}
        {(mapViewFilter === 'all' || mapViewFilter === 'checkpoints') && trip.checkpoints && trip.checkpoints.map((cp) => (
          cp.location && cp.location.lat && (
            <Marker key={cp._id} position={[cp.location.lat, cp.location.lng]}>
              <Popup className="font-sans min-w-[150px]">
                <div className="font-bold text-base">{cp.name}</div>
                <div className="text-xs text-muted-foreground mb-3">{cp.type}</div>
                <button 
                  onClick={() => handleNavigateToLocation(cp.location)} 
                  className="w-full bg-primary text-primary-foreground text-xs py-2 rounded-lg font-bold shadow hover:scale-105 transition-all"
                >
                  Navigate
                </button>
              </Popup>
            </Marker>
          )
        ))}
        
        {/* Member Locations */}
        {(mapViewFilter === 'all' || mapViewFilter === 'friends') && Object.entries(memberLocations || {}).map(([userId, loc]) => {
          const member = trip.members.find(m => m.user._id === userId);
          if (!member || !loc || !loc.lat) return null;
          
          const avatarIcon = L.divIcon({
            className: 'custom-avatar-icon bg-transparent border-none',
            html: `<div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 3px solid #6366f1; box-shadow: 0 4px 10px rgba(0,0,0,0.3); background-color: white; transform: translate(-5px, -5px);">
                     <img src="${member.user.avatar || 'https://via.placeholder.com/32'}" style="width: 100%; height: 100%; object-fit: cover;" />
                   </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          });

          return (
            <Marker key={userId} position={[loc.lat, loc.lng]} icon={avatarIcon}>
              <Popup className="font-sans min-w-[150px]">
                <div className="font-bold text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {member.user.name}
                </div>
                <div className="text-xs text-muted-foreground mb-3">Location updated recently</div>
                <button 
                  onClick={() => handleNavigateToLocation(loc)} 
                  className="w-full bg-primary text-primary-foreground text-xs py-2 rounded-lg font-bold shadow hover:scale-105 transition-all"
                >
                  Navigate
                </button>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Searched Place Marker */}
        {searchedPlace && (
          <Marker position={[searchedPlace.lat, searchedPlace.lng]}>
            <Popup><span className="font-bold">{searchedPlace.name}</span> (Preview)</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Filters & Location Controls */}
      <div className="absolute top-44 right-6 z-[1000] flex flex-col gap-2 items-end">
        <div className="bg-card/90 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border flex items-center gap-1">
          <button 
            onClick={() => setMapViewFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mapViewFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
          >
            All
          </button>
          <button 
            onClick={() => setMapViewFilter('checkpoints')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mapViewFilter === 'checkpoints' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
          >
            Checkpoints
          </button>
          <button 
            onClick={() => setMapViewFilter('friends')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mapViewFilter === 'friends' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
          >
            Friends
          </button>
        </div>
        
        <button
          onClick={() => setIsSharingLocation(!isSharingLocation)}
          className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl border flex items-center justify-center gap-2 transition-all ${isSharingLocation ? 'bg-green-500 text-white border-green-600' : 'bg-card/90 backdrop-blur-xl hover:bg-muted text-foreground'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          {isSharingLocation ? 'Sharing Location' : 'Share Location'}
        </button>
      </div>

      {searchedPlace && (
        <div className="absolute top-28 right-6 z-[1000] bg-card/90 backdrop-blur-xl p-4 pr-12 rounded-2xl shadow-2xl border flex items-center space-x-6 animate-in slide-in-from-right-4">
          <button 
            onClick={() => setSearchedPlace(null)} 
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 bg-background/50 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div>
            <h4 className="font-bold text-base max-w-[200px] truncate">{searchedPlace.name}</h4>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Add to itinerary?</p>
          </div>
          <button 
            onClick={handleAddCheckpointFromMap}
            className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
      )}

      {/* POI Carousel */}
      {searchResults.length > 0 && (
        <div className="absolute bottom-28 left-0 right-0 z-[1000] px-6 pointer-events-none">
          <div className="flex justify-end mb-2 pointer-events-auto">
            <button 
              onClick={() => {
                 setSearchResults([]);
              }}
              className="bg-card/90 backdrop-blur-xl border shadow-lg px-4 py-1.5 rounded-full text-xs font-bold text-foreground hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              Clear Places
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x pointer-events-auto">
            {searchResults.map((result, idx) => (
              <div 
                key={idx} 
                className="shrink-0 w-64 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl snap-center hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => handleFlyTo(result.lat, result.lon)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{result.nameOnly || result.display_name}</h4>
                  <div className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ml-2">POI</div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{result.display_name}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); selectPlace(result); }}
                    className="flex-1 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    View Map
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddCheckpointFromMap({
                        nameOnly: result.nameOnly,
                        display_name: result.display_name,
                        lat: result.lat,
                        lon: result.lon
                    }); }}
                    className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-colors shadow-lg shadow-primary/20"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
