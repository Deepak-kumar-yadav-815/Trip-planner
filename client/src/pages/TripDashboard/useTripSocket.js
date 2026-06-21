import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export function useTripSocket(tripId, setTrip, setMessages, setMemberStatuses, setMemberLocations) {
  const socketRef = useRef();

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket']
    });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_trip', tripId);
    });
    
    // Also emit immediately in case it's already connected
    if (socketRef.current.connected) {
      socketRef.current.emit('join_trip', tripId);
    }
    
    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('member_status_update', ({ userId, status }) => {
      setMemberStatuses(prev => ({ ...prev, [userId]: status }));
    });

    socketRef.current.on('member_location_update', ({ userId, lat, lng }) => {
      setMemberLocations(prev => ({ ...prev, [userId]: { lat, lng } }));
    });

    socketRef.current.on('checkpoint_added', (newCheckpoint) => {
      setTrip(prev => ({ 
        ...prev, 
        checkpoints: [...(prev.checkpoints || []), newCheckpoint] 
      }));
    });

    socketRef.current.on('checkpoint_updated', (updatedCheckpoint) => {
      setTrip(prev => ({ 
        ...prev, 
        checkpoints: (prev.checkpoints || []).map(cp => cp._id === updatedCheckpoint._id ? updatedCheckpoint : cp) 
      }));
    });

    socketRef.current.on('checkpoint_removed', (checkpointId) => {
      setTrip(prev => ({ 
        ...prev, 
        checkpoints: (prev.checkpoints || []).filter(cp => cp._id !== checkpointId) 
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tripId, setTrip, setMessages, setMemberStatuses, setMemberLocations]);

  const sendMessage = (messageData) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    }
  };

  const emitUpdateStatus = (statusData) => {
    if (socketRef.current) {
      socketRef.current.emit('update_status', statusData);
    }
  };

  const emitLocationUpdate = (locationData) => {
    if (socketRef.current) {
      socketRef.current.emit('update_location', locationData);
    }
  };

  return {
    sendMessage,
    emitUpdateStatus,
    emitLocationUpdate,
    socket: socketRef.current
  };
}
