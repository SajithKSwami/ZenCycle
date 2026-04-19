# ZenCycle Backend API

A professional Node.js & Express backend using Firebase Firestore for journaling and break tracking.

## Folder Structure
```
/
├── server.ts              # Entry point (Express + Vite)
├── firestore.rules        # Hardened Security Rules
├── firebase-blueprint.json # Database Schema Definitions
├── src/
│   └── server/
│       ├── controllers/   # Business Logic
│       ├── routes/        # API Endpoints
│       ├── middleware/    # Auth & Validation
│       └── lib/           # Firebase SDK Initialization
```

## Setup Instructions
1. **Firebase Setup**: 
   - Already provisioned in `us-west1`.
   - Security rules deployed per `firestore.rules`.
2. **Environment Variables**:
   - The app uses `firebase-applet-config.json` for IDs.
   - For a production deployment (Render/Firebase), ensure `service-account.json` is configured via environment variables.

## Running Locally
```bash
npm install
npm run dev
```

## API Endpoints

### 1. Journal Endpoints (`/api/journal`)
- `POST /` : Create entry (Requires Auth)
- `GET /` : List all user entries
- `GET /:id` : Get specific entry
- `PUT /:id` : Update entry
- `DELETE /:id` : Delete entry

### 2. Break Tracking Endpoints (`/api/breaks`)
- `POST /` : Log a break
- `GET /` : List all breaks
- `GET /:date` : Get breaks for YYYY-MM-DD
- `PUT /:id` : Update break
- `DELETE /:id` : Delete break

## Example Request (cURL)
```bash
curl -X POST http://localhost:3000/api/journal \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "dateTime": "2026-04-19T08:21:02-07:00",
    "achievement": "Implemented full CRUD backend",
    "learnings": ["Firebase Admin SDK", "Zod Validation"],
    "goodMoments": ["Backend worked on first try"],
    "okMoments": ["Debugging middleware"],
    "sadMoments": [],
    "reflectionSummary": "Succesful backend deployment."
  }'
```

## Authentication
This API expects a **Firebase ID Token** in the `Authorization: Bearer` header. You can obtain this on the frontend using `auth.currentUser.getIdToken()`.
