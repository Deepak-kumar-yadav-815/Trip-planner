import { useState, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";

export default function MediaTab({ tripId }) {
  const { getToken } = useAuth();
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMedia();
  }, [tripId]);

  const fetchMedia = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMedia(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    // Strict frontend validation just in case
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return alert('Only pictures (PNG, JPG, JPEG) are allowed.');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Do not set Content-Type here, browser sets it with boundary for FormData
        body: formData
      });
      
      if (res.ok) {
        setFile(null);
        fetchMedia(); // Refresh gallery
      } else {
        const data = await res.json();
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check if Cloudinary credentials are correct.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/media/${mediaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMedia(media.filter(m => m._id !== mediaId));
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Section */}
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-2">Upload Trip Photos</h3>
        <p className="text-xs text-muted-foreground mb-4 font-medium text-amber-600">Note: Only pictures (PNG, JPG, JPEG) are allowed. Videos or documents will be rejected.</p>
        
        <form onSubmit={handleUpload} className="flex items-center space-x-4">
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg" 
            onChange={(e) => setFile(e.target.files[0])}
            className="flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!file || uploading} 
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold shadow disabled:opacity-50 hover:bg-primary/90 transition-all"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            <p>No photos uploaded yet.</p>
          </div>
        ) : (
          media.map(m => (
            <div key={m._id} className="relative group rounded-xl overflow-hidden shadow-sm border aspect-square bg-muted">
              <img src={m.url} alt="Trip memory" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <button onClick={() => handleDelete(m._id)} className="self-end bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
                <div className="text-white">
                  <p className="text-xs font-medium truncate">{m.uploadedBy?.name}</p>
                  <p className="text-[10px] opacity-80">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
