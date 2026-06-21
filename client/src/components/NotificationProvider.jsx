import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import io from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!isSignedIn || !user) return;

    // Fetch historical notifications
    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();

    let SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    SOCKET_URL = SOCKET_URL.replace(/\/+$/, '');

    // Connect to global socket for personal notifications
    const socket = io(SOCKET_URL, {
      transports: ['websocket']
    });
    
    // We assume backend gets user's database ID. Since we only have Clerk ID here,
    // we should fetch the DB ID or let the backend emit using Clerk ID?
    // Wait! Backend `users/sync` creates DB User. If we don't have DB ID on frontend,
    // we can change backend `socket.on('join_user')` to use `clerkId` instead.
    socket.on('connect', () => {
      socket.emit('join_user', user.id); // Passing Clerk ID
    });
    
    // Also emit immediately in case it's already connected
    if (socket.connected) {
      socket.emit('join_user', user.id);
    }

    socket.on('receive_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [isSignedIn, user]);

  const markAsRead = async (id) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const clearAll = async () => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};
