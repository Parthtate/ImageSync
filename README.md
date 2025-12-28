# ImageSync - Scalable Image Import System

**Live Application:** https://imagesync-production.up.railway.app/

A production-ready, microservices-based system for importing images from Google Drive to cloud storage with real-time processing and metadata management.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [System Architecture](#system-architecture)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Scalability Design](#scalability-design)
- [Tech Stack](#tech-stack)

---

## Overview

ImageSync is a scalable backend system designed to import images from public Google Drive folders and store them in cloud object storage (Supabase Storage - S3 compatible). The system persists image metadata in a PostgreSQL database and provides REST APIs for importing and retrieving images. A React-based frontend provides user interaction for import management and image gallery viewing.

### Key Features

- Google Drive Integration for bulk image imports
- Background job processing with BullMQ and Redis queue
- Real-time job status tracking and progress updates
- Cloud storage with Supabase Storage (S3-compatible)
- PostgreSQL database for metadata persistence
- Microservices architecture for independent scalability
- Automatic retry mechanism with exponential backoff
- Fault-tolerant design with graceful error handling

---

## Live Demo

**Frontend Application:** https://imagesync-production.up.railway.app/  
**API Base URL:** https://api-service-production-3e48.up.railway.app/api

Test the application by:
1. Visiting the live URL
2. Entering a public Google Drive folder URL
3. Monitoring real-time import progress
4. Viewing imported images in the gallery

---

## System Architecture

The system implements a **multi-service microservices architecture** with three independent services that communicate through REST APIs and message queues.

### Architecture Diagram

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│   Client    │
└──────┬──────┘
       │ HTTP Requests
       ▼
┌─────────────┐      ┌──────────────┐
│ API Service │◄─────┤    Redis     │
│   (Express) │      │  Job Queue   │
└──────┬──────┘      └──────┬───────┘
       │                    │
       │ SQL Queries        │ Consume Jobs
       ▼                    ▼
┌─────────────┐      ┌──────────────┐
│ PostgreSQL  │      │Worker Service│
│  Database   │◄─────┤  (BullMQ)    │
└─────────────┘      └──────┬───────┘
                            │ Upload Files
                            ▼
                     ┌──────────────┐
                     │   Supabase   │
                     │   Storage    │
                     │ (S3-compatible)
                     └──────────────┘
```

### Service Breakdown

#### 1. Frontend Service (React Application)
**Purpose:** User interface for interacting with the system

**Responsibilities:**
- Provides import form for Google Drive URL input
- Displays real-time job status and progress updates
- Shows image gallery with metadata
- Handles user authentication and session management

**Technology:** React.js, Vite, TailwindCSS, Axios

---

#### 2. API Service (Node.js/Express)
**Purpose:** REST API server for request handling and job orchestration

**Responsibilities:**
- Accepts import requests and creates background jobs
- Manages job queue using BullMQ
- Queries database for image metadata
- Provides job status tracking endpoints
- Serves system statistics and health checks

**Technology:** Node.js, Express.js, BullMQ, PostgreSQL client

**Port:** 3000

---

#### 3. Worker Service (Background Processor)
**Purpose:** Asynchronous job processing for heavy operations

**Responsibilities:**
- Consumes jobs from Redis queue
- Downloads images from Google Drive API
- Uploads images to Supabase Storage (streaming)
- Persists metadata to PostgreSQL database
- Handles retries and error recovery
- Reports progress updates back to queue

**Technology:** Node.js, BullMQ, Google Drive API, Supabase SDK

**Processing:** Runs continuously as a background service

---

## API Documentation

### Base URL
```
Production: https://api-service-production-3e48.up.railway.app/api
Local: http://localhost:3000/api
```

### Endpoints

#### 1. Import from Google Drive

**Endpoint:** `POST /import/google-drive`

**Description:** Initiates an asynchronous import job for images from a public Google Drive folder.

**Request Body:**
```json
{
  "folderUrl": "https://drive.google.com/drive/folders/1ABC123XYZ"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "jobId": "job-1735392000000-abc123",
  "message": "Import job started successfully",
  "status": "waiting"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid Google Drive URL"
}
```

---

#### 2. Get All Images

**Endpoint:** `GET /images`

**Description:** Retrieves a paginated list of all imported images with metadata.

**Query Parameters:**
- `source` (optional): Filter by source (e.g., "google-drive")
- `limit` (optional): Number of results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```
GET /images?source=google-drive&limit=50&offset=0
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "vacation-photo.jpg",
      "google_drive_id": "1ABC123XYZ",
      "size": 2048576,
      "mime_type": "image/jpeg",
      "storage_path": "https://xyz.supabase.co/storage/v1/object/public/imported-images/2025-12-28/vacation-photo.jpg",
      "source": "google-drive",
      "created_at": "2025-12-28T10:30:45.123Z"
    }
  ],
  "pagination": {
    "total": 500,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Metadata Fields:**
- `name`: Original filename from Google Drive
- `google_drive_id`: Unique file ID from Google Drive
- `size`: File size in bytes
- `mime_type`: MIME type (e.g., image/jpeg, image/png)
- `storage_path`: Public URL of the file in Supabase Storage
- `source`: Import source identifier
- `created_at`: Timestamp of import completion

---

#### 3. Get Job Status

**Endpoint:** `GET /jobs/:jobId`

**Description:** Retrieves the current status and progress of an import job.

**Example Request:**
```
GET /jobs/job-1735392000000-abc123
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "job": {
    "id": "job-1735392000000-abc123",
    "status": "active",
    "progress": 65,
    "totalImages": 150,
    "processedImages": 98,
    "failedImages": 2,
    "startedAt": "2025-12-28T10:00:00.000Z",
    "updatedAt": "2025-12-28T10:05:30.000Z"
  }
}
```

**Job Status Values:**
- `waiting`: Job queued, not yet started
- `active`: Currently processing
- `completed`: Successfully finished
- `failed`: Job failed with errors

---

#### 4. Get System Statistics

**Endpoint:** `GET /stats`

**Description:** Returns overall system statistics.

**Success Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalImages": 1500,
    "totalSize": 524288000,
    "sources": {
      "google-drive": 1500
    },
    "lastImport": "2025-12-28T10:30:45.123Z"
  }
}
```

---

#### 5. Health Check

**Endpoint:** `GET /health`

**Description:** Service health check endpoint.

**Success Response (200 OK):**
```json
{
  "success": true,
  "service": "api",
  "timestamp": "2025-12-28T10:00:00.000Z",
  "uptime": 3600.5,
  "status": "healthy"
}
```

---

## Setup Instructions

### Prerequisites

- Node.js v18 or higher
- PostgreSQL database
- Redis server
- Supabase account (free tier works)
- Google Drive API key

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/Parthtate/ImageSync.git
cd ImageSync
```

#### 2. Database Setup

Create a PostgreSQL database and run the schema:

```bash
psql -U postgres -d imagesync -f api-service/schema.sql
```

Or manually create the database and run the schema file located at `api-service/schema.sql`.

#### 3. Configure API Service

Navigate to the API service directory:

```bash
cd api-service
npm install
```

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/imagesync
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

Start the API service:

```bash
npm start
```

The API will be available at `http://localhost:3000`.

#### 4. Configure Worker Service

Navigate to the worker service directory:

```bash
cd worker-service
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/imagesync
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_DRIVE_API_KEY=your-google-api-key
NODE_ENV=development
```

**Getting Supabase Credentials:**
1. Create a free account at https://supabase.com
2. Create a new project
3. Go to Settings > API
4. Copy the URL and service_role key
5. Create a storage bucket named "imported-images" (make it public)

**Getting Google Drive API Key:**
1. Go to Google Cloud Console
2. Create a new project or use existing
3. Enable Google Drive API
4. Create API credentials (API Key)
5. Copy the API key

Start the worker service:

```bash
npm start
```

#### 5. Configure Frontend

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Cloud Deployment (Railway.app)

The application is deployed on Railway.app with the following configuration:

**Services:**
- API Service: Deployed from `api-service` directory
- Worker Service: Deployed from `worker-service` directory
- Frontend Service: Deployed from `frontend` directory

**Environment Variables (set in Railway dashboard):**

For API Service:
- `PORT`: Auto-configured by Railway
- `DATABASE_URL`: PostgreSQL connection string (Supabase)
- `REDIS_URL`: Redis connection string (Upstash)
- `NODE_ENV`: production

For Worker Service:
- `DATABASE_URL`: Same as API service
- `REDIS_URL`: Same as API service
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key from Supabase
- `GOOGLE_DRIVE_API_KEY`: Google API key
- `NODE_ENV`: production

For Frontend:
- `VITE_API_URL`: Your Railway API service URL + /api

**Deployment Steps:**
1. Connect GitHub repository to Railway
2. Create three services (API, Worker, Frontend)
3. Configure environment variables for each service
4. Deploy each service from the respective directory
5. Set custom domains if needed

---

## Scalability Design

### Handling Large-Scale Imports (10,000+ Images)

The system is architected to efficiently handle large-scale imports through several design principles:

#### 1. Asynchronous Processing Architecture

**Problem:** Synchronous processing would block the API and timeout on large imports.

**Solution:**
- API immediately returns a job ID without waiting for completion
- Worker service processes the import asynchronously in the background
- Frontend polls for job status to show progress
- Decouples request handling from heavy computation

**Benefits:**
- API remains responsive even during large imports
- No timeout issues for long-running operations
- Multiple imports can be processed concurrently

#### 2. Queue-Based Job Management

**Technology:** BullMQ with Redis backend

**How it works:**
- API service pushes import jobs to Redis queue
- Worker service(s) consume jobs from the queue
- Jobs persist in Redis even if worker crashes
- Automatic retry on failures with exponential backoff

**Scalability:**
```
Single Worker:              Multiple Workers (Horizontal Scaling):
                           
Redis Queue                 Redis Queue
     │                          │
     └──► Worker 1              ├──► Worker 1 (Process subset)
                                ├──► Worker 2 (Process subset)
                                ├──► Worker 3 (Process subset)
                                └──► Worker N (Process subset)
```

**Key Features:**
- Add more worker instances without code changes
- Load balancing automatic via queue consumption
- Each worker processes different jobs simultaneously
- Linear scaling: 2x workers = ~2x throughput

#### 3. Concurrent Batch Processing

**Configuration:** Workers process images in batches with controlled concurrency.

**Default Settings:**
- Concurrency limit: 5 images processed simultaneously per worker
- Batch size: Configurable based on available memory
- Streaming uploads: Files streamed to storage without full memory load

**Example for 10,000 images:**
- Single worker (5 concurrent): ~2000 iterations
- 3 workers (15 total concurrent): ~667 iterations
- Significantly faster completion time with multiple workers

#### 4. Resource-Efficient Processing

**Memory Management:**
- Stream-based file downloads (no full file in memory)
- Stream-based uploads to Supabase Storage
- Garbage collection between batches
- Connection pooling for database and storage

**Network Optimization:**
- Parallel downloads from Google Drive
- Parallel uploads to Supabase
- Connection reuse via keep-alive
- Retry with exponential backoff on network failures

#### 5. Fault Tolerance and Recovery

**Retry Mechanism:**
- Failed images automatically retried (max 3 attempts)
- Exponential backoff: 1s, 2s, 4s delays
- Individual image failures don't stop entire job
- Failed images tracked separately in job status

**Error Handling:**
- Graceful degradation on network issues
- Transaction rollback on database errors
- Detailed error logging for debugging
- Job status reflects partial completion

**Recovery Scenarios:**
- Worker crash: Job automatically picked up by another worker
- Database connection loss: Automatic reconnection with retry
- Storage service down: Retry with backoff, then mark as failed
- Rate limiting: Automatic backoff and retry

#### 6. Database Optimization

**Indexes:**
- Primary key index on `id`
- Index on `google_drive_id` for duplicate detection
- Index on `source` for filtered queries
- Index on `created_at` for time-based queries

**Batch Operations:**
- Bulk inserts for multiple images
- Connection pooling (max 20 connections)
- Prepared statements for query optimization

#### 7. Monitoring and Progress Tracking

**Real-time Updates:**
- Job status updated every 10 images processed
- Progress percentage calculated dynamically
- Failed image count tracked separately
- Estimated completion time (future enhancement)

**Logging:**
- Structured logging for all operations
- Error tracking with stack traces
- Performance metrics (processing time per image)
- Job completion statistics

### Performance Benchmarks

**Current Configuration (Single Worker):**
- Processing speed: ~5-10 images/second (limited by Google Drive API)
- Memory usage: ~200MB per worker instance
- Network bandwidth: Depends on image sizes

**Horizontal Scaling:**
- 3 workers: ~15-30 images/second
- 5 workers: ~25-50 images/second
- Linear scaling up to Google Drive API rate limits

**For 10,000 Images:**
- Single worker: ~20-30 minutes
- 3 workers: ~7-10 minutes
- 5 workers: ~4-6 minutes

Note: Actual performance depends on image sizes, network conditions, and Google Drive API rate limits.

---

## Tech Stack

### Frontend
- **Framework:** React.js 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **State Management:** React Hooks

### Backend
- **Runtime:** Node.js 18
- **Framework:** Express.js 5
- **Job Queue:** BullMQ
- **Database Client:** pg (PostgreSQL)
- **Storage Client:** @supabase/supabase-js

### Infrastructure
- **Database:** PostgreSQL 15 (Supabase)
- **Storage:** Supabase Storage (S3-compatible)
- **Cache/Queue:** Redis (Upstash)
- **Deployment:** Railway.app
- **Version Control:** Git/GitHub

### External APIs
- **Google Drive API:** For folder and file access
- **Supabase Storage API:** S3-compatible object storage

---

## Project Structure

```
ImageSync/
├── api-service/           # REST API service
│   ├── config/            # Database and Redis configuration
│   ├── controllers/       # Request handlers
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── schema.sql         # Database schema
│   ├── index.js           # API server entry point
│   └── package.json
│
├── worker-service/        # Background job processor
│   ├── config/            # Supabase and Redis configuration
│   ├── worker.js          # Worker entry point
│   └── package.json
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## License

MIT License

## Author

**Parth Tate**
- GitHub: [@Parthtate](https://github.com/Parthtate)
