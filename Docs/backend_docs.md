# Backend Architecture & Documentation

## Architecture Overview
The Voyage backend is built with **Node.js** and **Express.js**. It operates as a hybrid architecture:
1. **RESTful API:** Handles standard CRUD operations (creating trips, fetching data, uploading media).
2. **Real-Time Engine:** Uses **Socket.io** coupled with **Redis** to handle high-frequency data (chat messages, live locations, status updates) and broadcast them to specific rooms.

---

## Model Architecture & Relationships
The database utilizes MongoDB via Mongoose. The schemas are highly relational, using `ObjectId` references to tie everything back to a central `Trip` or `User`.

1. **`User`**
   - **Fields:** `clerkId` (Primary key tying to Clerk Auth), `name`, `email`, `avatar`, `currentStatus`, `customStatuses`.
   - **Relationships:** Independent, but referenced heavily by other models.

2. **`Trip`**
   - **Fields:** `title`, `description`, `joinId` (unique 6-char code), `status`, `aiSummary`.
   - **Relationships:**
     - `members`: An array of subdocuments containing a `user` reference (`ObjectId`) and their `role`.
     - `checkpoints`: An array of `ObjectId` references to the `Checkpoint` model.

3. **`Checkpoint`**
   - **Fields:** `tripId`, `name`, `type`, `location` (lat/lng), `aiSummary`.
   - **Relationships:** Belongs to a `Trip`. Contains a `visitedBy` array of `User` ObjectIds.

4. **`Message`**
   - **Fields:** `tripId`, `content`, `type`.
   - **Relationships:** Belongs to a `Trip`. `sender` references a `User`.

5. **`Note`** & **`Expense`** & **`Media`**
   - Similar structure: All belong to a `tripId`. They contain references to the `User` who created/paid for them.

---

## Controllers & Routes Detailed Overview

### 1. `routes/trips.js`
Handles the core lifecycle of a trip.
- **`GET /`**: Fetches all trips where the requesting user is a member.
- **`POST /`**: Creates a new trip and makes the creator an 'admin'.
- **`POST /join`**: Allows a user to join a trip using the 6-character `joinId`.
- **`GET /:id`**: Fetches full trip details, heavily populating nested user and checkpoint data.
- **`POST /:id/finalize`**: Aggregates all trip data (expenses, notes, chat history) and sends it to the AI (Gemini/Groq) to generate a celebratory Markdown summary. Marks the trip status as 'completed'.
- **`POST /:id/ai-chat`**: Accepts an array of messages and returns a response from the Groq AI model acting as a helpful assistant.

### 2. `routes/checkpoints.js`
Handles itinerary stops within a specific trip.
- **`POST /`**: Creates a new checkpoint and emits a `checkpoint_added` socket event.
- **`POST /:checkpointId/visit`**: Marks a checkpoint as visited by the group.
- **`POST /:checkpointId/summary`**: Calls the AI service to generate a quick summary of the specific location.
- **`POST /explore`**: Uses Gemini AI to return a JSON list of suggested places based on a user query.
- **`PUT /:checkpointId/reorder`**: Updates the array order of checkpoints within the Trip document.

### 3. `routes/users.js`
Manages user profiles and statuses.
- **`POST /sync`**: Called when a user logs in. Creates or updates the MongoDB User document based on data from Clerk.
- **`PUT /me/status`**: Updates the user's current status (e.g., "Running late", "Need help"). If the status is "Need help", it triggers a global socket broadcast to all trips the user is part of.

### 4. `routes/media.js`
Handles file uploads.
- **`POST /upload`**: Utilizes `multer` and `multer-storage-cloudinary` to parse incoming multipart/form-data, upload the file directly to Cloudinary, and save the resulting URL in the `Media` MongoDB collection.

### 5. `routes/voice.js`
- **`GET /token`**: Generates a secure JWT using the `livekit-server-sdk` granting the user permission to join the specific LiveKit audio room for their trip.

---

## Key Packages Used

| Package | Purpose |
| :--- | :--- |
| **`express`** | The core web server framework for routing API requests. |
| **`mongoose`** | Object Data Modeling (ODM) library for MongoDB. |
| **`socket.io`** | Enables real-time, bidirectional, event-based communication. |
| **`redis`** | Used heavily in `socket.js` to cache the last 100 chat messages per trip for blazing-fast retrieval before persisting them to MongoDB. |
| **`@clerk/clerk-sdk-node`** | Validates incoming JWT tokens from the frontend to ensure API routes are securely authenticated. |
| **`multer` & `multer-storage-cloudinary`** | Middleware for handling file uploads and streaming them securely to Cloudinary. |
| **`@google/genai` & `groq-sdk`** | SDKs for interacting with external LLMs to power the AI Assistant and trip summaries. |
| **`livekit-server-sdk`** | Generates secure access tokens for voice rooms. |
