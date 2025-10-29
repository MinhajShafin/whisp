import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Timeline from "@/pages/Timeline";
import Profile from "@/pages/Profile";
import Friends from "@/pages/Friends";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";

const router = createBrowserRouter([
  // Public routes (no navbar)
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  // Private (main) routes with navbar
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Timeline /> },
      { path: "/timeline", element: <Timeline /> },
      { path: "/profile/:id", element: <Profile /> },
      { path: "/friends", element: <Friends /> },
      { path: "/messages/:friendId?", element: <Messages /> },
      { path: "/settings", element: <Settings /> },
      { path: "/friends/:friendId?", element: <Friends /> },
    ],
  },
]);

export default router;
