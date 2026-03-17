# Court Reservation - Next.js

A court reservation system built with Next.js 14, TypeScript, Prisma, and SQLite.

## Features

- User authentication with NextAuth.js
- Court browsing and searching
- Real-time availability checking
- Booking management with QR codes
- Payment proof upload (GCash)
- Admin dashboard with reports
- User profile management

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via Prisma ORM
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js

## Quick Start (Clone & Run)

### Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- No database server needed — uses SQLite (file-based)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Court-Reservation.Nextjs
```

### 2. Install dependencies

```bash
npm install
```

> Prisma client is auto-generated after install via the `postinstall` script.

### 3. Run the setup script (first time only)

```bash
npm run setup
```

This will automatically:
- Copy `.env.example` → `.env`
- Generate Prisma client
- Create the SQLite database
- Seed an admin user and sample courts
- Create upload directories

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the app

- **Local:** [http://localhost:3000](http://localhost:3000)
- **Admin login:** `admin@court.com` / `admin123`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | First-time setup (env, DB, seeds) |
| `npm run dev` | Start dev server (network accessible) |
| `npm run dev:local` | Start dev server (localhost only) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed:admin` | Seed admin user |
| `npm run seed:courts` | Seed sample courts |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Regenerate Prisma client |

## Environment Variables

Copy `.env.example` to `.env` (the setup script does this automatically):

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

See `.env.example` for all available options. The only required variables are:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./court_reservation.sqlite` |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT secret key | Must be set |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── bookings/          # Booking pages
│   ├── courts/            # Court pages
│   ├── profile/           # User profile
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── layout/            # Layout components
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
└── types/                # TypeScript types

prisma/
└── schema.prisma         # Database schema

scripts/
├── setup.js              # First-time setup
├── dev-network.js        # Dev server (network mode)
├── seed-admin.js         # Seed admin user
└── seed-courts.js        # Seed sample courts
```

## API Routes

### Public
- `GET /api/courts` — List courts
- `GET /api/courts/[id]` — Court details
- `GET /api/courts/[id]/slots` — Available time slots

### Protected (User)
- `GET /api/bookings` — User's bookings
- `POST /api/bookings` — Create booking
- `GET /api/bookings/[id]` — Booking details
- `GET /api/profile` — User profile
- `PUT /api/profile` — Update profile

### Admin
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/bookings` — All bookings
- `GET /api/admin/users` — All users

## Troubleshooting

### `Failed to load SWC binary`
Delete `node_modules` and reinstall:
```bash
rm -rf node_modules .next
npm install
```

### Database errors
Reset the database:
```bash
rm prisma/court_reservation.sqlite
npx prisma db push
npm run seed:admin
npm run seed:courts
```

### Port already in use
Use a different port:
```bash
PORT=3001 npm run dev
```

## License

MIT
