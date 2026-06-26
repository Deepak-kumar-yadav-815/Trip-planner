# Frontend Architecture & Documentation

## Architecture Overview
The Voyage frontend is a robust Single-Page Application (SPA) built using **React 19** and **Vite**. It follows a component-based architecture designed for real-time collaboration. The app is deeply integrated with WebSockets to provide instantaneous updates across all users in a trip, bypassing the need for constant HTTP polling.

State management is primarily handled via React Context (e.g., `NotificationProvider`) and custom hooks (e.g., `useTripSocket.js`), keeping the logic tightly coupled to the component lifecycle.

---

## Key Packages Used

| Package | Purpose |
| :--- | :--- |
| **`react` & `react-dom`** | Core UI library. |
| **`react-router-dom`** | Handles client-side routing and protected routes. |
| **`socket.io-client`** | Establishes the persistent WebSocket connection to the Node.js server for real-time chat, location, and itinerary updates. |
| **`@clerk/clerk-react`** | Manages user authentication, sessions, and secure login flows. |
| **`@livekit/components-react`** | Provides pre-built, highly optimized React components for handling WebRTC audio/video rooms (Voice feature). |
| **`react-leaflet` & `leaflet`** | Renders interactive maps for the TripMap feature, plotting checkpoints and live user locations. |
| **`tailwindcss` & `shadcn`** | Utility-first CSS framework combined with accessible, pre-built UI components for rapid, beautiful styling. |
| **`framer-motion`** | Handles smooth, declarative animations across the dashboard. |

---

## Routing Structure
The application uses `react-router-dom` defined inside `App.jsx`.

- **`/` (Landing Page):** The public-facing marketing page.
- **`/home` (Dashboard Home):** Protected route. Displays a list of the user's active/past trips and allows them to create or join a new trip.
- **`/trip/:id` (Trip Workspace):** Protected route. The core interface for a specific trip. Contains the map, chat, itinerary, and voice features.

*Note: The `<ProtectedRoute>` wrapper leverages Clerk's `useAuth` hook to instantly redirect unauthenticated users back to the landing page.*

---

## File Overviews & Important Functions

### `/src/App.jsx`
The root component. Wraps the application in a `NotificationProvider` and sets up the routing logic.
- **`ProtectedRoute` function:** Checks if `isLoaded` and `isSignedIn` from Clerk are true before rendering child components.

### `/src/components/NotificationProvider.jsx`
A global React Context that listens to the `user_[id]` socket room for system-wide notifications (e.g., "User X needs help" or "Trip finalized").
- **Important logic:** Utilizes an effect to bind to `receive_notification` socket events and trigger UI toasts globally.

### `/src/pages/TripDashboard/index.jsx`
The primary layout component for a single trip. It fetches the initial trip data via REST API and then initializes the WebSocket connection.
- **Important logic:** Mounts the layout structure (Sidebar, Main Map, Right Panel) and passes the trip state down as props.

### `/src/pages/TripDashboard/useTripSocket.js`
A custom hook that abstracts all Socket.io event listeners for a trip.
- **Functions:**
  - `join_trip`: Emits a signal to join the specific socket room.
  - Listeners for `receive_message`, `member_location_update`, `checkpoint_added`, etc. Updates the local React state instantly when these events are fired from the server.

### `/src/pages/TripDashboard/TripMap.jsx`
Handles the rendering of the interactive map.
- **Important logic:** Takes the trip's `checkpoints` and the live `memberLocations` from the socket state to render custom Map markers.

### `/src/pages/TripDashboard/TripChat.jsx`
The real-time messaging component.
- **Important logic:** Reads from the local `messages` array populated by `useTripSocket`. Uses a form to emit `send_message` via Socket.io to the server.

### `/src/pages/TripDashboard/AIChatbox.jsx`
The interface for the WhatsApp-style AI assistant.
- **Important logic:** Sends the current chat history to the `POST /api/trips/:id/ai-chat` endpoint and appends the AI's response to the chat feed.

### `/src/components/VoiceRoom.jsx`
Handles the LiveKit integration.
- **Important logic:** Fetches a secure token from `GET /api/trips/:id/voice/token`, then connects to the LiveKit cloud server to enable group audio communication.
