# Unit Optimizer

An AI-powered educational tool that analyzes student assessment data and provides actionable insights for improving lesson plans and student outcomes.

## Features

- Upload and analyze student assessment files
- AI-powered analysis of student performance
- Identification of commonly missed questions
- Lesson improvement recommendations
- Interactive visualization of analysis results

## Tech Stack

- Next.js 14
- TypeScript
- Prisma (PostgreSQL)
- OpenAI API
- TailwindCSS
- Recharts for data visualization

## Prerequisites

- Node.js 18+
- PostgreSQL
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd unit-optimizer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
DATABASE_URL="postgresql://[user]@localhost:5432/unit_optimizer?schema=public"
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET="your-jwt-secret"
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Project Structure

- `/app` - Next.js application code
  - `/api` - API routes
  - `/components` - React components
  - `/services` - Business logic and services
  - `/lib` - Utility functions and configurations
- `/prisma` - Database schema and migrations
- `/public` - Static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 