# StudyBuddyFinder

A full-stack web app to find study partners based on subjects, availability, and study style.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)

## Features
- Register / Login with JWT auth
- Edit profile (subjects, availability, study style, bio)
- Browse & search study buddies
- Smart matching by shared subjects
- Send / accept / reject connection requests
- Create & join study sessions
- Direct messaging between connected users

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 1. Backend
```bash
cd be
npm install
# Edit .env if needed (MONGO_URI, JWT_SECRET)
npm run dev
```
Server runs on http://localhost:5000

### 2. Frontend
```bash
cd fe
npm install
npm run dev
```
App runs on http://localhost:5173

## Environment Variables (be/.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/studybuddyfinder
JWT_SECRET=your_secret_key
NODE_ENV=development
```
