# StudyBuddyFinder 🚀

StudyBuddyFinder is a modern, full-stack application designed to connect students, facilitate study sessions, and manage collaborative learning environments. The platform features an interactive WebRTC-powered video hub, real-time messaging, AI-augmented matching, and a seamless cross-platform mobile experience.

## ✨ Features

- **WebRTC Video Hub:** High-performance, real-time study rooms with secure video and audio conferencing.
- **Real-Time Communication:** Integrated messaging system using `socket.io` for seamless communication between study buddies.
- **AI Matching & Recommendations:** Leverages Google Generative AI and Pinecone for intelligent matchmaking and vectorized search capabilities.
- **Session Management:** Comprehensive UI and backend system for creating, managing, and tracking study sessions and reservations.
- **Dynamic Billing Administration:** Centralized admin tools to manage pricing, product configurations, and flexible discounts using Razorpay.
- **Cross-Platform Mobile App:** Built using Capacitor, delivering a native iOS and Android experience directly from the single web codebase.
- **Interactive UI & Animations:** A premium, glassmorphic design system powered by Framer Motion, GSAP, and Tailwind CSS.
- **Privacy & Security First:** Robust data-minimization protocols, GDPR/DPDP compliant structures, XSS/NoSQL injection protection (Helmet, Mongo Sanitize), and rate-limiting.

## 🛠️ Technology Stack

### Frontend (User & Admin Interface)
- **Frameworks:** React 19, Vite
- **Styling:** Tailwind CSS, Emotion, Material-UI (MUI), PostCSS
- **Animations:** Framer Motion, GSAP, Canvas Confetti
- **Mapping & Visuals:** React Three Fiber, React Leaflet
- **Mobile Integration:** Capacitor
- **Collaboration & Extras:** Socket.io-client, Simple-peer (WebRTC), tldraw

### Backend (Server, API & Database)
- **Core:** Node.js, Express 5
- **Database:** MongoDB (Mongoose)
- **AI & Vector Search:** `@google/generative-ai`, `@ai-sdk/google`, Pinecone
- **Authentication & Security:** JWT, bcryptjs, Helmet, Express Rate Limit, Express Validator
- **Real-Time:** Socket.io
- **Payments:** Razorpay
- **Cloud Storage:** Cloudinary, Multer

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)
- API Keys for Google Gemini, Pinecone, Resend (for emails), Razorpay, and Cloudinary.

### 1. Clone & Install
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd be
npm install
```

### 2. Environment Configuration
Create an `.env` file in the `be/` directory and populate the required environment variables:
```env
PORT=...
MONGO_URI=...
JWT_SECRET=...
PINECONE_API_KEY=...
GOOGLE_API_KEY=...
CLOUDINARY_URL=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### 3. Running Locally

**Start the Backend Server:**
```bash
cd be
npm run dev
```

**Start the Frontend Client:**
```bash
# from the root directory
npm run dev
```

The frontend will run via Vite's dev server, while the backend utilizes `nodemon` for active reloading.

## 📱 Mobile Development

This project uses Capacitor to package the web application as native iOS and Android apps.
```bash
# Build the frontend project
npm run build

# Sync the build with capacitor
npx cap sync
```

Open iOS / Android project:
```bash
npx cap open ios
npx cap open android
```

## 🔐 Privacy & Compliance

This platform enforces tight API constraints, whitelisted projection layers, and enforces robust access control for sensitive user data, protecting against enumeration and brute-force attacks.

## 📄 License
ISC
