# Court Reservation - Next.js

This is the Next.js version of the Court Reservation system, translated from the original PHP Laravel application.

## Features

- User authentication with NextAuth.js
- Court browsing and searching
- Real-time availability checking
- Booking management
- Payment proof upload
- Admin dashboard
- User profile management

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** MySQL with Prisma ORM
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **Icons:** Font Awesome

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
DATABASE_URL="mysql://root:@localhost:3306/court_reservation"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma db push
```

5. (Optional) Seed the database:
```bash
npx prisma db seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

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
    └── index.ts

prisma/
└── schema.prisma         # Database schema
```

## API Routes

### Public
- `GET /api/courts` - List courts
- `GET /api/courts/[id]` - Court details
- `GET /api/courts/[id]/slots` - Available time slots

### Protected (User)
- `GET /api/bookings` - User's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Booking details
- `GET /api/profile` - User profile
- `PUT /api/profile` - Update profile

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/users` - All users

## Database

The application uses the same MySQL database as the original PHP version. Make sure the `court_reservation` database exists and has the required tables.

## License

MIT
