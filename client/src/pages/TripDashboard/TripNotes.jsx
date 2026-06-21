import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

const COLORS = [
  { name: 'Default', value: 'bg-card', btnClass: 'bg-card' },
  { name: 'Red', value: 'bg-red-500/20', btnClass: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500/20', btnClass: 'bg-orange-500' },
  { name: 'Yellow', value: 'bg-yellow-500/20', btnClass: 'bg-yellow-500' },
  { name: 'Green', value: 'bg-green-500/20', btnClass: 'bg-green-500' },
  { name: 'Blue', value: 'bg-blue-500/20', btnClass: 'bg-blue-500' },
  { name: 'Purple', value: 'bg-purple-500/20', btnClass: 'bg-purple-500' },
  { name: 'Pink', value: 'bg-pink-500/20', btnClass: 'bg-pink-500' },
];

export default function TripNotes({ tripId, activeTab, user, socket, trip }) {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isComposing, setIsComposing] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('bg-card');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteColor, setEditNoteColor] = useState('bg-card');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (activeTab !== 'notes') return;

    const fetchNotes = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/trips/${tripId}/notes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [activeTab, tripId, getToken, API_URL]);

  useEffect(() => {
    if (!socket || activeTab !== 'notes') return;

    const handleNoteAdded = (newNote) => {
      setNotes((prev) => [newNote, ...prev]);
    };

    const handleNoteUpdated = (updatedNote) => {
      setNotes((prev) => prev.map(note => note._id === updatedNote._id ? updatedNote : note));
    };

    const handleNoteDeleted = (deletedNoteId) => {
      setNotes((prev) => prev.filter(note => note._id !== deletedNoteId));
    };

    socket.on('note_added', handleNoteAdded);
    socket.on('note_updated', handleNoteUpdated);
    socket.on('note_deleted', handleNoteDeleted);

    return () => {
      socket.off('note_added', handleNoteAdded);
      socket.off('note_updated', handleNoteUpdated);
      socket.off('note_deleted', handleNoteDeleted);
    };
  }, [socket, activeTab]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const token = await getToken();
      await fetch(`${API_URL}/trips/${tripId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newNoteContent, color: newNoteColor })
      });
      setNewNoteContent('');
      setNewNoteColor('bg-card');
      setIsComposing(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editNoteContent.trim()) return;

    try {
      const token = await getToken();
      await fetch(`${API_URL}/trips/${tripId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editNoteContent, color: editNoteColor })
      });
      setEditingNoteId(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note._id);
    setEditNoteContent(note.content);
    setEditNoteColor(note.color);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/trips/${tripId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const myDbId = trip?.members?.find(m => m.user.clerkId === user?.id)?.user._id;

  if (activeTab !== 'notes') return null;

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar p-6 pt-32 pb-40 animate-in fade-in duration-500">
      
      {/* Note Composer */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className={`bg-card/80 backdrop-blur border rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${isComposing ? 'ring-2 ring-primary/50' : 'hover:shadow-2xl'}`}>
          {isComposing ? (
            <div className="p-4 flex flex-col gap-4">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Take a note..."
                className="w-full bg-transparent border-none resize-none focus:ring-0 text-foreground text-lg placeholder:text-muted-foreground min-h-[120px]"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setNewNoteColor(c.value)}
                      title={c.name}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${c.btnClass} ${newNoteColor === c.value ? 'border-primary scale-110' : 'border-transparent hover:scale-110'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsComposing(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors">
                    Close
                  </button>
                  <button onClick={handleAddNote} className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsComposing(true)}
              className="w-full text-left p-4 text-muted-foreground text-lg font-medium hover:bg-card/90 transition-colors"
            >
              Take a note...
            </button>
          )}
        </div>
      </div>

      {/* Notes Masonry Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center text-muted-foreground py-20 font-medium text-lg">
          No notes yet. Be the first to add one!
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {notes.map(note => (
            editingNoteId === note._id ? (
              <div key={note._id} className={`break-inside-avoid relative rounded-2xl p-4 border shadow-xl ring-2 ring-primary/50 ${editNoteColor} ${editNoteColor !== 'bg-card' ? 'border-transparent' : ''}`}>
                <textarea
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  className="w-full bg-transparent border-none resize-none focus:ring-0 text-foreground text-[15px] leading-relaxed min-h-[100px]"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-1">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setEditNoteColor(c.value)}
                        title={c.name}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${c.btnClass} ${editNoteColor === c.value ? 'border-primary scale-110' : 'border-transparent hover:scale-110'}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingNoteId(null)} className="px-3 py-1.5 text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleUpdateNote(note._id)} className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                key={note._id} 
                className={`break-inside-avoid relative group rounded-2xl p-5 border shadow-sm transition-all hover:shadow-xl ${note.color} ${note.color !== 'bg-card' ? 'border-transparent' : ''}`}
              >
                <p className="whitespace-pre-wrap text-foreground font-medium text-[15px] leading-relaxed mb-6">
                  {note.content}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <img src={note.author.avatar || 'https://via.placeholder.com/32'} className="w-6 h-6 rounded-full object-cover border shadow-sm" alt={note.author.name} />
                    <span className="text-xs font-semibold text-muted-foreground truncate max-w-[100px]">{note.author.name}</span>
                  </div>
                  
                  {note.author._id === myDbId && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={() => startEditing(note)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"
                        title="Edit Note"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                        title="Delete Note"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
