import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Appbar from "./components/layout/Appbar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import TripDashboard from "./pages/TripDashboard";
import { NotificationProvider } from "./components/NotificationProvider";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background font-sans text-foreground">
        <Appbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trip/:id" 
          element={
            <ProtectedRoute>
              <TripDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
    </NotificationProvider>
  );
}

export default App;
