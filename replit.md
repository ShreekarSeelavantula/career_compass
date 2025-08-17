# AI Talent Match Platform

## Overview

AI Talent Match is a modern recruiting platform that connects job seekers with recruiters using AI-powered matching and semantic search. The system uses Elasticsearch as the primary data store, provides real-time chat capabilities, and includes ML-powered resume parsing and candidate ranking. The platform supports job posting, application management, interview scheduling, and intelligent matching between candidates and positions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with React and TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: Wouter for client-side routing
- **Real-time Features**: WebSocket integration for chat functionality

### Backend Architecture
- **Hybrid Backend**: 
  - Node.js/Express server for development proxy and static file serving
  - Django REST Framework as the main API backend with Django Channels for WebSocket support
- **Authentication**: JWT-based authentication with middleware for protected routes
- **File Storage**: Configurable storage (local filesystem or S3) for resume uploads
- **Real-time Communication**: WebSocket support via Django Channels for chat functionality

### Data Storage
- **Primary Database**: Elasticsearch as the sole data store (no traditional SQL/NoSQL database)
- **Search Indices**: Separate indices for users, jobs, applications, interviews, and events
- **Vector Storage**: Dense vector fields in Elasticsearch for semantic search using 384-dimensional embeddings
- **File Storage**: Separate file storage system for resume PDFs and documents

### ML and AI Components
- **Resume Parsing**: Automatic extraction of skills, experience, and contact information from PDF/DOCX files
- **Semantic Matching**: Sentence transformer models for generating embeddings and calculating similarity
- **Hybrid Ranking**: Combines BM25 lexical search, semantic similarity, and rule-based scoring
- **Skills Extraction**: NLP-based skill identification and categorization

### Authentication and Authorization
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Role-Based Access**: Support for job seekers, recruiters, and admin roles
- **Middleware Protection**: API endpoints protected based on user roles and permissions

## External Dependencies

### Core Infrastructure
- **Elasticsearch**: Primary data store for all application data including vector embeddings
- **Redis**: Optional caching layer and session storage for Django Channels
- **PostgreSQL**: Fallback database option (configured but not actively used per architecture spec)

### Machine Learning Services
- **Sentence Transformers**: For generating semantic embeddings (model: all-MiniLM-L6-v2)
- **spaCy**: NLP processing for resume parsing and text analysis
- **scikit-learn**: Additional ML utilities for ranking and classification

### File Processing
- **PyPDF2**: PDF text extraction for resume parsing
- **python-docx**: Microsoft Word document processing
- **Pillow**: Image processing capabilities

### Cloud Services (Optional)
- **AWS S3/Google Cloud Storage**: Configurable cloud file storage via django-storages
- **boto3**: AWS SDK integration for S3 operations

### Development and Deployment
- **Neon Database**: Serverless PostgreSQL service (configured in Drizzle but not primary storage)
- **Replit Integration**: Development environment optimizations and error handling
- **Vite**: Frontend build tool with development server and HMR

### Communication
- **Email Services**: Configured for notifications (implementation-dependent)
- **Video Meeting Integration**: Placeholder for external video meeting services
- **Real-time Messaging**: WebSocket-based chat system via Django Channels