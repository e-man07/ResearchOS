# ResearchOS Web Application

Next.js 14 application with App Router, Prisma, and API routes.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Database
```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your PostgreSQL connection string

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing

### Unit & Integration Tests
```bash
npm test
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/            # React components
├── lib/                   # Client utilities
└── server/                # Server-side code
    ├── db.ts             # Prisma client
    └── actions/          # Server actions
```

## API Routes

- `POST /api/v1/searches` - Create search
- `GET /api/v1/searches/:id` - Get search
- `POST /api/v1/reports/:searchId` - Generate report
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project

## Database

Using Prisma with PostgreSQL.

### Commands
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio
