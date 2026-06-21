import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = [
  { id: 'interesting_places', label: '⭐ All', icon: '⭐' },
  { id: 'foods', label: '🍔 Food', icon: '🍔' },
  { id: 'cultural', label: '🏛️ Culture', icon: '🏛️' },
  { id: 'natural', label: '🌲 Nature', icon: '🌲' },
  { id: 'amusements', label: '🎢 Fun', icon: '🎢' }
];

export default function PlaceSearchBar({
  searchQuery,
  setSearchQuery,
  onLocationSelect,
  isSearchingAI,
  handleAISearchPlace,
  onClose
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState('interesting_places');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced Photon API Call
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsTyping(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.features || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Photon API error:", err);
      } finally {
        setIsTyping(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (feature) => {
    const { geometry, properties } = feature;
    const lat = geometry.coordinates[1];
    const lon = geometry.coordinates[0];
    const name = properties.name || properties.city || properties.state;
    
    setSearchQuery(name);
    setShowDropdown(false);
    
    if (onLocationSelect) {
      onLocationSelect({ name, lat, lon, category: activeCategory });
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    // If a place is already selected/searched, we might want to re-trigger the search
    // But for simplicity, we pass the category when they select a place, or they can re-select.
  };

  return (
    <div className="w-[calc(100vw-3rem)] max-w-2xl md:w-[650px] animate-in fade-in zoom-in-95 duration-300 origin-center" ref={dropdownRef}>
      
      {/* Category Badges (Floating above search) */}
      <div className="flex flex-wrap gap-2 mb-2 px-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
              activeCategory === cat.id 
                ? 'bg-primary text-primary-foreground border-primary scale-105' 
                : 'bg-card/80 backdrop-blur-md text-foreground border-border/50 hover:bg-muted'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Search Bar */}
      <form className="relative flex shadow-2xl rounded-full bg-card/90 backdrop-blur-xl border border-white/10 p-1" onSubmit={(e) => e.preventDefault()}>
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            placeholder="Search city, address, or landmark..."
            autoFocus
            className="w-full h-12 px-6 rounded-l-full border-none bg-transparent focus:outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/70"
          />
          {isTyping && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        


        {/* Close Button */}
        <button 
          onClick={onClose} 
          type="button" 
          className="h-12 w-12 flex items-center justify-center bg-muted/30 hover:bg-red-500/10 hover:text-red-500 rounded-r-full transition-colors border-l border-border/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[2000]">
          <ul className="py-2">
            {suggestions.map((item, idx) => {
              const { name, city, state, country } = item.properties;
              const title = name || city || state;
              const subtitle = [city, state, country].filter(Boolean).filter(s => s !== title).join(', ');
              
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors flex flex-col"
                  >
                    <span className="font-bold text-sm text-foreground">{title}</span>
                    {subtitle && <span className="text-xs text-muted-foreground font-medium">{subtitle}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
