# Whisp Frontend

A modern, cozy microblogging platform frontend built with React, Vite, and shadcn/ui.

## 🚀 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Linting**: ESLint 9

## ✨ Features

- 🎨 Beautiful UI with shadcn/ui components
- 🌓 Dark/Light theme support
- 🔐 JWT authentication with protected routes
- 💬 Real-time-like whisper feed
- ❤️ Reddit-style like/dislike system with points
- 💭 Nested comments and replies
- 👥 Friend system with blocking
- 📱 Fully responsive design
- ♿ Accessible components
- 🎯 Path aliases (`@/`) for clean imports

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on port 5000 (see `backend/README.md`)

## 🛠️ Setup

### 1. Navigate to frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Tailwind CSS

Make sure your `src/global.css` includes:

```css
@import "tailwindcss";
```

### 4. Start development server

```bash
npm run dev
```

The app will run on **http://localhost:5173** (or the next available port).

### 5. Connect to backend

Update the base URL in `src/api/axiosInstance.js` if your backend is not on `http://localhost:5000`:

```javascript
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  // ...
});
```

## 📦 Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code with ESLint
npm run lint
```

## 🎨 Adding shadcn/ui Components

This project uses shadcn/ui for pre-built, accessible components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

Examples:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
```

Components will be added to `src/components/ui/` and can be imported like:

```javascript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

## 📁 Project Structure

```
src/
├── api/                    # API integration
│   ├── authAPI.js         # Auth endpoints
│   ├── whisperAPI.js      # Whisper CRUD & interactions
│   ├── friendAPI.js       # Friend management
│   ├── messageAPI.js      # Messaging
│   └── axiosInstance.js   # Axios config with interceptors
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui base components
│   ├── Navbar.jsx        # Navigation bar
│   ├── WhisperCard.jsx   # Whisper display
│   └── CommentSection.jsx # Comments & replies
├── context/              # React Context
│   ├── AuthContext.jsx   # Auth state
│   └── ThemeContext.jsx  # Theme preference
├── hooks/                # Custom hooks
│   └── useAuth.js       # Auth hook
├── layouts/              # Layout components
│   └── PublicLayout.jsx # Layout for public pages
├── pages/                # Page components
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Timeline.jsx      # Main feed
│   ├── Profile.jsx       # User profile
│   ├── Friends.jsx       # Friend management
│   └── Settings.jsx      # User settings
├── utils/                # Utility functions
│   ├── calculatePoints.js
│   └── formatDate.js
├── lib/                  # Library utilities
│   └── utils.js         # cn() and other helpers
├── App.jsx              # Root component
├── router.jsx           # Route definitions
├── main.jsx             # Entry point
└── global.css           # Global styles
```

For detailed structure documentation, see [STRUCTURE.md](./STRUCTURE.md).

## 🎯 Path Aliases

Import from `src/` using the `@/` alias:

```javascript
// Instead of relative imports
import Navbar from "../../../components/Navbar";

// Use clean aliases
import Navbar from "@/components/Navbar";
import { login } from "@/api/authAPI";
import { formatDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
```

## 🔐 Authentication Flow

### Login/Register

1. User submits credentials via `Login.jsx` or `Register.jsx`
2. API call to backend via `authAPI.js`
3. JWT token received and stored in `AuthContext`
4. Token added to axios instance default headers
5. User redirected to timeline

### Protected Routes

Routes like `/timeline`, `/profile`, `/friends` are protected. Unauthenticated users are redirected to `/login`.

### Logout

1. User clicks logout in `Navbar`
2. Token sent to backend `/api/auth/logout` (blacklisted)
3. Token cleared from context and axios headers
4. User redirected to home/login

## 🎨 Styling Guide

### Tailwind CSS

Use Tailwind utility classes for styling:

```jsx
<div className="flex items-center gap-4 rounded-lg bg-slate-100 p-4">
  <h2 className="text-xl font-bold text-slate-900">Title</h2>
</div>
```

### Theme Support

The app supports light/dark themes via `ThemeContext`:

```jsx
import { useTheme } from "@/context/ThemeContext";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return <button onClick={toggleTheme}>Current theme: {theme}</button>;
}
```

### Custom Styles

Add global styles or CSS variables to `src/global.css`:

```css
@import "tailwindcss";

:root {
  --primary: 220 50% 50%;
  --background: 0 0% 100%;
}

.dark {
  --primary: 220 50% 60%;
  --background: 0 0% 10%;
}
```

## 🧩 Component Guidelines

### Creating New Components

1. **Place in correct folder**:

   - Base UI components → `src/components/ui/`
   - App-specific components → `src/components/`
   - Page components → `src/pages/`

2. **Use proper naming**:

   - PascalCase for component files: `WhisperCard.jsx`
   - PascalCase for exports: `export default WhisperCard`

3. **Follow composition pattern**:

```jsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WhisperCard({ whisper }) {
  return (
    <Card>
      <p>{whisper.content}</p>
      <Button>Like</Button>
    </Card>
  );
}
```

## 📡 API Integration

### Making API Calls

All API calls go through dedicated API files in `src/api/`:

```javascript
// src/api/whisperAPI.js
import axiosInstance from "./axiosInstance";

export const getTimeline = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get("/whispers/timeline", {
    params: { page, limit },
  });
  return response.data;
};
```

### Using in Components

```jsx
import { useState, useEffect } from "react";
import { getTimeline } from "@/api/whisperAPI";

function Timeline() {
  const [whispers, setWhispers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const data = await getTimeline();
        setWhispers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {whispers.map((whisper) => (
        <WhisperCard key={whisper._id} whisper={whisper} />
      ))}
    </div>
  );
}
```

## 🔧 Configuration Files

### `vite.config.js`

- Vite build configuration
- React plugin with SWC
- Tailwind CSS integration
- Path aliases

### `jsconfig.json`

- JavaScript project settings
- Path aliases for IDE support

### `eslint.config.js`

- ESLint flat config
- React hooks rules
- Code quality rules

### `components.json`

- shadcn/ui configuration
- Component style preferences
- Import paths

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is taken:

```bash
# Vite will automatically use the next available port
# Or specify a port:
npm run dev -- --port 3000
```

### Module Not Found

If imports fail:

1. Check path aliases are set up in `vite.config.js` and `jsconfig.json`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear cache: `rm -rf node_modules/.vite`

### Backend Connection Error

- Verify backend is running on `http://localhost:5000`
- Check `axiosInstance.js` has correct `baseURL`
- Check CORS is enabled in backend

### Tailwind Styles Not Working

1. Ensure `@import "tailwindcss";` is in `src/global.css`
2. Check `vite.config.js` has `@tailwindcss/vite` plugin
3. Restart dev server

## 📱 Responsive Design

Use Tailwind responsive prefixes:

```jsx
<div
  className="
  p-4           // padding on mobile
  md:p-6        // medium screens and up
  lg:p-8        // large screens and up
  grid-cols-1   // 1 column on mobile
  md:grid-cols-2 // 2 columns on medium+
  lg:grid-cols-3 // 3 columns on large+
"
>
  {/* Content */}
</div>
```

## ♿ Accessibility

shadcn/ui components are built with accessibility in mind:

- Keyboard navigation
- Screen reader support
- ARIA attributes
- Focus management

Always add proper labels and alt text:

```jsx
<Button aria-label="Like whisper">
  <Heart />
</Button>

<img src={avatar} alt={`${username}'s avatar`} />
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output is in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables

For production, set:

- `VITE_API_BASE_URL`: Backend API URL
- Use in `axiosInstance.js`: `baseURL: import.meta.env.VITE_API_BASE_URL`

## 🧪 Testing (Future)

Recommended testing setup:

- **Unit tests**: Vitest
- **Component tests**: React Testing Library
- **E2E tests**: Playwright or Cypress

```bash
# Install Vitest
npm i -D vitest @testing-library/react @testing-library/jest-dom

# Add to package.json
"scripts": {
  "test": "vitest"
}
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` to check for issues
4. Submit a pull request

## 📝 License

ISC

---

_Made with ☕ and 🌿 | Part of the Whisp project_
