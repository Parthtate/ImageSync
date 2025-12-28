# ImageSync - Image Import Web-App

**Live Application:** https://imagesync-production.up.railway.app/

ImageSync is a microservices-based system for importing images from Google Drive to cloud storage with real-time processing and metadata management.

---
## Tech Stack

**Frontend:** React.js, Vite, TailwindCSS, Axios  
**Backend:** Node.js, Express.js, BullMQ  
**Database:** PostgreSQL (Supabase)  
**Storage:** Supabase Storage (S3-compatible)  
**Queue:** Redis (Upstash)  
**Deployment:** Railway.app

---

## Project Structure

```
ImageSync/
├── api-service/           # REST API service
│   ├── config/            # Database and Redis configuration
│   ├── controllers/       # Request handlers
│   ├── routes/            # Routes
│   ├── middleware/        # Custom middleware
│   ├── schema.sql         # Database schema
│   └── index.js           # Entry point
├── worker-service/        # Background job processor
│   ├── config/            # Supabase and Redis configuration
│   └── worker.js          # Entry point
├── frontend/              # React application
│   └── src/
│       ├── components/    # React components
│       ├── services/      # API client
│       └── App.jsx        # Main component
└── README.md
```

---

## System Architecture

The system implements a multi-service microservices architecture with three independent services:

### Service Breakdown

**1. Frontend Service (React Application)**
- Provides user interface for import management
- Displays real-time job status and progress updates
- Shows image gallery with metadata
- Technology: React.js, Vite, TailwindCSS

**2. API Service (Node.js/Express)**
- Handles HTTP requests and creates background jobs
- Manages job queue using BullMQ
- Queries database for image metadata
- Provides job status tracking and statistics
- Technology: Node.js, Express.js, BullMQ, PostgreSQL

**3. Worker Service (Background Processor)**
- Consumes jobs from Upstash Redis queue
- Downloads images from Google Drive API
- Uploads images to Supabase Storage (streaming)
- Persists metadata to PostgreSQL database
- Handles retries and error recovery
- Technology: Node.js, BullMQ, Google Drive API, Supabase SDK

**Communication Flow:**
- Frontend sends HTTP requests to API Service
- API Service creates jobs in Redis queue
- Worker Service consumes jobs from queue
- Worker downloads from Google Drive and uploads to Supabase Storage
- Worker saves metadata to PostgreSQL
- Frontend polls API for job status updates

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL database
- Upstash Redis server
- Supabase account
- Google Drive API key

### Local Development

**1. Clone Repository**
```bash
git clone https://github.com/Parthtate/ImageSync.git
cd ImageSync
```

**2. Database Setup**
```bash
psql -U postgres -d imagesync -f api-service/schema.sql
```

**3. API Service**
```bash
cd api-service
npm install
```

Create `.env`:
```env
PORT=3000
DATABASE_URL=Your PostgreSQL Database URL
REDIS_URL=Your Upstash Redis URL
```

Start service:
```bash
npm start
```

**4. Worker Service**
```bash
cd worker-service
npm install
```

Create `.env`:
```env
DATABASE_URL=Your PostgreSQL Database URL
REDIS_URL=Your Upstash Redis URL
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=Your Supabase Service Role Key
GOOGLE_DRIVE_API_KEY=Your Google Drive API Key
```

Start service:
```bash
npm start
```

**5. Frontend**
```bash
cd frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

Start development server:
```bash
npm run dev
```

Access at http://localhost:5173

### Cloud Deployment (Railway.app)

**Services Configuration:**
- API Service: Deployed from `api-service` directory
- Worker Service: Deployed from `worker-service` directory
- Frontend Service: Deployed from `frontend` directory

---

## Author

Parth Tate  
GitHub: [@Parthtate](https://github.com/Parthtate)
