# ImageSync - Image Import System

ImageSync is a microservices-based application designed to process and import images from Google Drive to Supabase Storage. It features a modern React frontend, a robust Node.js API, and a dedicated worker service for handling background jobs.

## Features

- **Google Drive Integration**: Import images directly from public Google Drive folders.
- **Background Processing**: Heavy image processing tasks are handled asynchronously by a worker service using Redis queues.
- **Real-time Updates**: Track import progress and status in real-time.
- **Supabase Storage**: Secure and scalable image storage.
- **Metadata Management**: PostgreSQL database for structured image metadata.

## System Architecture

The project consists of three main components:

1.  **Frontend**: A React application for user interaction, job submission, and gallery viewing.
2.  **API Service**: A Node.js/Express server that manages job queues (BullMQ) and serves file metadata.
3.  **Worker Service**: A background process that consumes jobs from the queue, downloads files from Google Drive, and uploads them to Supabase.

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (v18 or higher)
- Redis Server (Running locally on port 6379)
- PostgreSQL Database
- Supabase Project (for storage bucket)

## Installation and Setup

### 1. Database Setup

Ensure your PostgreSQL database is running. Connect to it and run the schema script found in `api-service/schema.sql` to create the necessary tables.

### 2. API Service

Navigate to the `api-service` directory:
cd api-service
npm install

Create a `.env` file based on `.env.example` and configure your database and Redis connection details.

Start the API server:
npm start

### 3. Worker Service

Navigate to the `worker-service` directory:
cd worker-service
npm install

Create a `.env` file based on `.env.example`. You will need your Supabase credentials and Google Drive API configuration.

Start the worker:
npm start

### 4. Frontend

Navigate to the `frontend` directory:
cd frontend
npm install

Create a `.env` file based on `.env.example`.

Start the development server:
npm run dev

## API Endpoints

- **POST /api/import/google-drive**: Start a new import job.
- **GET /api/jobs/:jobId**: Check the status of a specific job.
- **GET /api/images**: List imported images.
- **GET /api/stats**: Get system statistics.
- **GET /api/health**: Check system health.
