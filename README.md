# MindCare Hub - Mental Health Platform

A comprehensive mental health platform built with Next.js, TypeScript, and PostgreSQL.

## Features

- **Multi-role Authentication**: Admin, Psychiatrist, Counselor, Patient roles
- **Patient Dashboard**: Mood tracking, appointment booking, community forum
- **Provider Dashboard**: Patient management, appointment scheduling, clinical notes
- **Admin Dashboard**: User management, analytics, system overview
- **Community Forum**: Anonymous posting and moderation
- **Messaging System**: Patient-provider communication
- **Resource Library**: Educational materials and downloads

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, PostgreSQL
- **Authentication**: JWT tokens
- **Database**: PostgreSQL with connection pooling
- **Deployment**: AWS Serverless (Lambda, API Gateway, RDS)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sarkar-Bohara/mind-care.git
   cd mind-care
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Setup database**
   - Create PostgreSQL database
   - Run migration scripts in `/scripts` folder

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Test Accounts

- **Admin**: `arun.bohara` / `admin123`
- **Psychiatrist**: `khusi.ray` / `doctor123`
- **Counselor**: `denish.thapa` / `counselor123`
- **Patient**: `Unisha.Shrestha` / `password123`

## Deployment

See `serverless-deployment-guide.md` for complete AWS serverless deployment instructions.

## Database Schema

- `users` - User accounts and authentication
- `appointments` - Appointment scheduling
- `mood_entries` - Mood tracking data
- `community_posts` - Forum posts
- `messages` - Patient-provider messaging
- `resources` - Educational resources

## License

MIT License