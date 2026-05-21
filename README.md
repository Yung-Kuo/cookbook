# Cookbook

A full-stack recipe app for creating, sharing, and organizing recipes. Users can browse public recipes, manage their own cookbook, like recipes, and group them into collections.

## Stack

| Layer | Tech |
|-------|------|
| API | Django 5 + Django REST Framework |
| App | Next.js 15 (React 19, TypeScript, Tailwind) |
| Data | PostgreSQL (production) or SQLite (local fallback) |
| Media | Cloudinary |

## Project layout

```
cookbook/
├── backend/          # Django API
├── next-frontend/    # Next.js app (primary UI)
├── frontend/         # Legacy Vite + React app
└── scripts/          # Dev utilities (e.g. seed templates)
```

## Getting started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` with at least `SECRET_KEY` and any other vars your environment needs (database, Cloudinary, OAuth, etc.). Then:

```bash
python manage.py migrate
python manage.py runserver
```

API runs at [http://localhost:8000](http://localhost:8000).

### Frontend

```bash
cd next-frontend
npm install
```

Create `next-frontend/.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Add OAuth client IDs if you use social login (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GITHUB_CLIENT_ID`).

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### Optional: seed template recipes

From `next-frontend`:

```bash
npm run seed:templates
```

## License

Private project — all rights reserved unless otherwise noted.
