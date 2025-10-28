# Whisp Frontend - File/Folder Structure

## 📁 Project Overview

```
frontend/
├── public/                          # Static assets served directly
├── src/                             # Source code
│   ├── api/                         # API integration layer
│   │   ├── authAPI.js              # Authentication endpoints
│   │   ├── axiosInstance.js        # Axios config with interceptors
│   │   ├── friendAPI.js            # Friend management endpoints
│   │   ├── messageAPI.js           # Messaging endpoints
│   │   └── whisperAPI.js           # Whisper CRUD & interactions
│   │
│   ├── assets/                      # Images, icons, fonts
│   │
│   ├── components/                  # Reusable React components
│   │   ├── ui/                      # Base UI components (shadcn/ui style)
│   │   │   ├── button.jsx          # Base button component
│   │   │   ├── input.jsx           # Base input component
│   │   │   └── label.jsx           # Base label component
│   │   ├── Button.jsx              # Custom button wrapper
│   │   ├── CommentSection.jsx      # Comment/reply UI with likes
│   │   ├── Navbar.jsx              # Navigation bar
│   │   └── WhisperCard.jsx         # Individual whisper display
│   │
│   ├── context/                     # React Context providers
│   │   ├── AuthContext.jsx         # Authentication state
│   │   └── ThemeContext.jsx        # Theme (light/dark mode)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   └── useAuth.js              # Auth hook for consuming AuthContext
│   │
│   ├── lib/                         # Library utilities
│   │   └── utils.js                # General utility functions (cn, etc.)
│   │
│   ├── pages/                       # Page components (routes)
│   │   ├── Friends.jsx             # Friends management page
│   │   ├── home.jsx                # Landing/home page
│   │   ├── Login.jsx               # Login page
│   │   ├── Profile.jsx             # User profile page
│   │   ├── Register.jsx            # Registration page
│   │   ├── Settings.jsx            # User settings page
│   │   └── Timeline.jsx            # Main feed/timeline page
│   │
│   ├── utils/                       # Utility functions
│   │   ├── calculatePoints.js      # Reddit-style points calculation
│   │   └── formatDate.js           # Date formatting helpers
│   │
│   ├── App.jsx                      # Root component
│   ├── global.css                   # Global styles & Tailwind imports
│   ├── main.jsx                     # App entry point
│   └── router.jsx                   # Route definitions
│
├── .gitignore                       # Git ignore rules
├── components.json                  # shadcn/ui component config
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML template
├── jsconfig.json                    # JavaScript/path config
├── package.json                     # Dependencies & scripts
├── README.md                        # Project documentation
└── vite.config.js                   # Vite bundler config
```

---

## 📂 Folder Descriptions

### `/public`

Static assets that are served as-is without processing. Examples:

- Favicon, robots.txt, manifest.json
- Any files that need direct URL access

### `/src/api`

**Purpose**: Centralize all backend API calls

Each file exports functions that interact with specific backend endpoints:

- `authAPI.js`: register(), login(), logout()
- `whisperAPI.js`: getWhispers(), createWhisper(), likeWhisper(), addComment(), etc.
- `friendAPI.js`: sendFriendRequest(), acceptRequest(), blockUser(), etc.
- `messageAPI.js`: sendMessage(), getConversation()
- `axiosInstance.js`: Configured axios with base URL, interceptors for auth tokens, error handling

**Benefits**:

- Single source of truth for API endpoints
- Easy to mock for testing
- Consistent error handling

### `/src/assets`

**Purpose**: Store images, icons, fonts, and other media

Examples:

- Logo images
- User avatars (if not from CDN)
- Icon SVGs
- Custom fonts

### `/src/components`

**Purpose**: Reusable UI components used across multiple pages

**Structure**:

- `/ui/`: Base primitive components (buttons, inputs, cards) - often from UI libraries like shadcn/ui
- Root level: Application-specific components (Navbar, WhisperCard, CommentSection)

**Component Guidelines**:

- Keep components small and focused
- Use props for customization
- Extract repeated UI patterns into components

### `/src/context`

**Purpose**: React Context providers for global state

- `AuthContext.jsx`: User authentication state, login/logout functions
- `ThemeContext.jsx`: Theme preference (light/dark mode)

**Usage Pattern**:

```jsx
// In provider
<AuthContext.Provider value={{ user, login, logout }}>
  {children}
</AuthContext.Provider>;

// In consumer
const { user, logout } = useAuth();
```

### `/src/hooks`

**Purpose**: Custom React hooks for reusable logic

- `useAuth.js`: Hook to access AuthContext
- Future: `usePagination.js`, `useDebounce.js`, `useLocalStorage.js`

**Benefits**:

- Encapsulate complex logic
- Reusable across components
- Easier to test

### `/src/lib`

**Purpose**: Library utilities and third-party integrations

- `utils.js`: General utility functions (className merging, etc.)
- Future: API clients, validation schemas, constants

### `/src/pages`

**Purpose**: Top-level page components mapped to routes

Each file represents a full page/view:

- `home.jsx`: Landing page for visitors
- `Login.jsx` / `Register.jsx`: Authentication pages
- `Timeline.jsx`: Main feed (protected)
- `Profile.jsx`: User profile (protected)
- `Friends.jsx`: Friend management (protected)
- `Settings.jsx`: User settings (protected)

**Route Mapping** (in `router.jsx`):

```jsx
/ → home.jsx
/login → Login.jsx
/register → Register.jsx
/timeline → Timeline.jsx (protected)
/profile/:id → Profile.jsx (protected)
/friends → Friends.jsx (protected)
/settings → Settings.jsx (protected)
```

### `/src/utils`

**Purpose**: Pure utility functions (no React dependencies)

- `calculatePoints.js`: Calculate like/dislike points
- `formatDate.js`: Date formatting helpers
- Future: validation helpers, string formatters, etc.

**Difference from `/src/lib`**:

- `utils/`: App-specific pure functions
- `lib/`: Library wrappers and general utilities

---

## 🎯 Path Aliases

With `@/` alias configured in `vite.config.js` and `jsconfig.json`:

```javascript
// Instead of:
import Navbar from "../../../components/Navbar";
import { login } from "../../../api/authAPI";

// Use:
import Navbar from "@/components/Navbar";
import { login } from "@/api/authAPI";
```

**Configured aliases**:

- `@/` → `/src`

---

## 📝 File Naming Conventions

### Components

- **PascalCase** for component files: `Button.jsx`, `WhisperCard.jsx`
- **PascalCase** for component names: `function Button()`, `export default WhisperCard`

### Pages

- **PascalCase** for page files: `Login.jsx`, `Timeline.jsx`
- Exception: `home.jsx` (lowercase) - common for landing pages

### Utilities & Hooks

- **camelCase** for utility files: `formatDate.js`, `calculatePoints.js`
- **camelCase** for hook files: `useAuth.js`, `usePagination.js`

### API Files

- **camelCase** for API files: `authAPI.js`, `whisperAPI.js`

---

## 🔄 Data Flow

```
User Interaction
    ↓
Page Component (e.g., Timeline.jsx)
    ↓
API Call (e.g., whisperAPI.getTimeline())
    ↓
Axios Instance (authToken, base URL)
    ↓
Backend API (port 5000)
    ↓
Response
    ↓
State Update (Context or useState)
    ↓
UI Re-render
```

---

## 🛠️ Key Configuration Files

### `vite.config.js`

- Vite bundler configuration
- React plugin with SWC compiler
- Tailwind CSS integration
- Path aliases (`@/` → `src/`)

### `jsconfig.json`

- JavaScript project configuration
- Path aliases for editor support
- JSX configuration

### `eslint.config.js`

- ESLint flat config format
- React hooks and refresh plugins
- Code quality rules

### `package.json`

- Dependencies: React, React Router, Axios, Tailwind
- Scripts: `dev`, `build`, `lint`, `preview`

### `components.json`

- shadcn/ui configuration
- Component generation settings

### `global.css`

- Tailwind CSS imports
- Global styles and CSS variables
- Theme tokens

---

## 🚀 Development Workflow

1. **Start dev server**:

   ```bash
   npm run dev
   ```

2. **Component creation**:

   - Create in `/src/components/` or `/src/pages/`
   - Import and use with `@/` alias
   - Add to router if it's a page

3. **API integration**:

   - Add endpoint function in appropriate API file
   - Use in component with try/catch
   - Handle loading and error states

4. **Styling**:
   - Use Tailwind utility classes
   - Add custom styles to `global.css`
   - Use CSS modules for component-specific styles (optional)

---

## 📦 Recommended Future Additions

```
src/
├── constants/               # App constants (API URLs, limits, etc.)
│   └── config.js
├── schemas/                 # Validation schemas (Zod, Yup)
│   └── authSchema.js
├── services/                # Business logic layer
│   └── whisperService.js
├── store/                   # Global state (if using Redux/Zustand)
│   └── store.js
└── types/                   # TypeScript types (if migrating)
    └── whisper.d.ts
```

---

## 🎨 Component Organization Best Practices

### When to create a new component:

- UI pattern used 2+ times
- Component exceeds ~200 lines
- Logic can be reused elsewhere
- Improves readability

### Component composition example:

```
Timeline.jsx
├── uses Navbar.jsx
├── uses WhisperCard.jsx
│   ├── uses Button.jsx (like/dislike)
│   └── uses CommentSection.jsx
│       └── uses Button.jsx (reply)
└── uses Pagination.jsx (future)
```

---

## 🔐 Protected Routes Pattern

```jsx
// router.jsx
import ProtectedRoute from "@/components/ProtectedRoute";

<Route element={<ProtectedRoute />}>
  <Route path="/timeline" element={<Timeline />} />
  <Route path="/profile/:id" element={<Profile />} />
  <Route path="/friends" element={<Friends />} />
</Route>;
```

---

_This structure follows React and Vite best practices, with clear separation of concerns and scalability in mind._
