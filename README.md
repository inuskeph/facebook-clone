# Facebook Clone (Supabase Edition)

A full-featured Facebook clone built with **Supabase** for backend (auth, database, real-time) and vanilla HTML/CSS/JS for the frontend. Zero build tools required.

## Features

- **Authentication** - Email/password sign up & login via Supabase Auth
- **News Feed** - Posts with likes, comments, shares, privacy settings
- **User Profiles** - Editable bio, location, workplace, cover photo, avatar
- **Friends** - Send/accept/decline requests, suggestions, friend list
- **Messenger** - Real-time conversations between users
- **Notifications** - Likes, comments, friend requests with unread badge
- **Stories** - Create text stories with custom colors (24h expiry)
- **Groups** - Create, join, leave groups (public/private)
- **Pages** - Business pages with likes/followers
- **Marketplace** - Buy/sell items with categories and search
- **Search** - Search people, posts, groups globally

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to you)
3. Wait for the project to finish setting up

### 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to execute
5. This creates all tables, RLS policies, and the auto-profile trigger

### 3. Configure the App

1. In your Supabase dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon/public key**
3. Open `app.js` and replace the first two lines:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 4. Configure Auth (Optional)

1. Go to **Authentication > Providers** in your Supabase dashboard
2. Email auth is enabled by default
3. To skip email confirmation for testing: Go to **Authentication > Settings** and disable "Confirm email"

### 5. Run the App

Just open `index.html` in your browser! No server needed.

Or use any static file server:
```bash
# Python
python3 -m http.server 3000

# Node.js (npx)
npx serve .

# VS Code Live Server extension
# Just right-click index.html > Open with Live Server
```

Then open http://localhost:3000

### 6. Create Test Users

1. Register a few accounts through the app's sign up form
2. Or use Supabase Dashboard > Authentication > Users > Create User

## File Structure

```
facebook-clone/
├── index.html           # HTML entry point (loads Supabase SDK from CDN)
├── app.js               # Full SPA - all features in one file
├── styles.css           # Complete Facebook-like CSS styling
├── supabase-schema.sql  # Database schema (tables + RLS + triggers)
└── README.md            # This file
```

## Tech Stack

- **Frontend**: Vanilla JavaScript SPA (no framework, no build tools)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Styling**: Custom CSS matching Facebook's design language
- **CDN**: Supabase JS client loaded from jsdelivr

## Notes

- All data is stored in your Supabase database (persistent!)
- Row Level Security ensures users can only access their own data
- The trigger auto-creates a profile when a user signs up
- Stories auto-expire after 24 hours (filtered by `expires_at`)
- No npm, no webpack, no build step - just open the HTML file
