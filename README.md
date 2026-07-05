# NovaMind Backend API

A full-stack productivity application backend built with Node.js, Express, and PostgreSQL.

## 🚀 Live API
https://novamind-backend-production-2f94.up.railway.app

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **AI**: Groq AI (Llama 3)
- **Deployment**: Railway

## 📋 Features
- User authentication (signup/login)
- JWT protected routes
- Full CRUD task management
- AI-powered task suggestions
- Secure password hashing

## 🔗 API Endpoints

### Auth
- POST /auth/signup
- POST /auth/login

### Tasks (Protected)
- GET    /tasks
- POST   /tasks
- PUT    /tasks/:id
- DELETE /tasks/:id

### AI (Protected)
- POST /ai/suggest

## 🏃 Running Locally

```bash
npm install
node server.js
```

## Environment Variables
```
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
DATABASE_URL=your_postgres_url
GROQ_API_KEY=your_groq_key
```