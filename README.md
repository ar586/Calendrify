# Calendrify 📅

> Your academic timetable, automatically synced to your calendar.

Calendrify is a full-stack web application built for NSUT students to seamlessly sync their class schedules, end-semester exams, and academic events directly into Google Calendar or a built-in web calendar — all from one place.

---

## ✨ Features

- **Google OAuth Login** — Secure, one-click sign-in with your Google account
- **Student Profile** — Set your degree, branch, semester, and section once
- **Smart Event Sync** — Automatically finds your classes, exams, and holidays based on your profile
- **Web Calendar** — A built-in interactive monthly calendar to view and manage events without needing Google Calendar
- **Google Calendar Sync** — Push your schedule directly to Google Calendar with per-event reminders
- **Custom Events** — Add personal events (study sessions, etc.) to your web calendar
- **PWA Support** — Install Calendrify on your device as a Progressive Web App

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Auth | Google OAuth 2.0, JWT |
| Calendar API | Google Calendar API (googleapis) |

---

## 📁 Project Structure

```
Calendrify/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing / Login page
│   │   │   ├── about/page.tsx        # About page
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx          # Main dashboard
│   │   │   │   └── WebCalendar.tsx   # Web Calendar component
│   │   │   └── auth/success/page.tsx # OAuth callback handler
│   │   └── components/
│   │       └── InstallPWAButton.tsx
│   └── .env.local                    # Frontend env vars (gitignored)
│
└── backend/           # Express.js backend API
    └── src/
        ├── index.ts                  # Server entry point
        ├── models/
        │   ├── User.ts               # User model
        │   ├── AcademicEvent.ts      # Event model
        │   └── UserEventMapping.ts   # User ↔ Event mapping
        ├── routes/
        │   ├── auth.ts               # Google OAuth routes
        │   ├── user.ts               # Profile routes
        │   └── sync.ts               # Event sync routes
        └── scripts/
            └── importDataV3.ts       # Data import script
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A Google Cloud project with OAuth 2.0 credentials and the Google Calendar API enabled

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Calendrify.git
cd Calendrify
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/calendrify
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `/frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm run dev
```

The app will be running at **http://localhost:3000**.

---

## 🗄️ Data Import

Academic data (timetables, exam schedules, events) is imported via a script. The source JSON files are **private and not included in this repository**.

To import your own data:

1. Place your source JSON files at the root of the repo (see `importDataV3.ts` for the expected structure)
2. Run:

```bash
cd backend
npx ts-node src/scripts/importDataV3.ts
```

---

## 🌐 Deployment

For production deployment:

1. Set your backend environment variables on your hosting platform (Railway, Render, etc.)
2. Set `NEXT_PUBLIC_API_URL=https://your-backend-domain.com` in your frontend hosting settings (Vercel, etc.)
3. Update `GOOGLE_REDIRECT_URI` and `FRONTEND_URL` in your backend `.env` to production URLs
4. Register the production redirect URI in your Google Cloud Console

---

## 📸 Screenshots

> Coming soon

---

## 👤 Author

**Aryan Anand**  
[LinkedIn](https://www.linkedin.com/in/aryan-anand-4aba06309/) · [GitHub](https://github.com/ar586)

---

## 📄 License

This project is for personal and educational use. The academic data scraped from NSUT is private and not redistributed.
