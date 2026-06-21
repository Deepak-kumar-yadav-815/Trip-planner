import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Moon, Sun, Bell } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "../NotificationProvider";

export default function Appbar() {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Since Appbar might render before user is logged in, we safely destructure or default
  const notificationsContext = useNotifications();
  const { notifications = [], unreadCount = 0, markAsRead, clearAll } = notificationsContext || {};

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full h-14 box-border border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/50 shadow-sm transition-all duration-300">
      <div className="container flex h-full items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary/70 group-hover:opacity-80 transition-opacity">Realtime TripPlanner</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-accent transition-colors">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <SignedIn>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2 rounded-full hover:bg-accent transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-background border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]">
                  <div className="p-3 border-b flex justify-between items-center bg-muted/30">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button onClick={() => { clearAll(); setShowNotifications(false); }} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">Clear All</button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          onClick={() => { if(!n.isRead) markAsRead(n._id); }}
                          className={`p-3 border-b text-sm transition-colors cursor-pointer ${n.isRead ? 'bg-background opacity-70' : 'bg-primary/5 hover:bg-primary/10'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-primary capitalize">{n.type}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-foreground">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-colors hover:bg-primary/90">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
