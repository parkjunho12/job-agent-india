# Job Agent India - Frontend

React + Vite frontend for Job Agent India.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Server state
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/     # Reusable components
│   ├── Layout.jsx
│   └── ProtectedRoute.jsx
├── pages/          # Page components
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   └── ...
├── services/       # API services
│   └── api.js
├── stores/         # Zustand stores
│   └── authStore.js
├── utils/          # Utility functions
├── App.jsx         # Main app component
├── main.jsx        # Entry point
└── index.css       # Global styles
```

## Environment Variables

Create `.env` file:

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Build for Production

```bash
npm run build
```

Output: `dist/` folder

## Deploy

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

## Features

- ✅ User authentication
- ✅ Job listing & details
- ✅ Application management
- ✅ Experience management
- ✅ Settings & profile
- ⏳ Dashboard stats (coming soon)
- ⏳ Real-time notifications (coming soon)

## License

MIT