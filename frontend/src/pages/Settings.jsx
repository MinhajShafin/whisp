import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";

export default function Settings() {
  const { user, logout } = useContext(AuthContext);

  // Profile
  const [profile, setProfile] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password (stub)
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Email preferences (stub)
  const [emailPrefs, setEmailPrefs] = useState({ notifications: true });

  // Danger zone (stub)
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");

  // Theme
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem("theme") || "system";
    return "system";
  });

  const applyTheme = (value) => {
    setTheme(value);
    if (typeof window === "undefined") return;
    localStorage.setItem("theme", value);
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const root = window.document.documentElement;
    if (value === "dark" || (value === "system" && prefersDark))
      root.classList.add("dark");
    else root.classList.remove("dark");
  };

  useEffect(() => {
    applyTheme(theme);
    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        if (localStorage.getItem("theme") === "system") applyTheme("system");
      };
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [theme]);

  // Handlers
  const handleProfileChange = (e) => {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg("");
    setProfileErr("");
    try {
      await axiosInstance.put("/users/me", profile);
      setProfileMsg("Profile updated!");
    } catch (err) {
      setProfileErr(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMsg(""), 2000);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg("");
    setPwErr("");
    if (passwords.new !== passwords.confirm) {
      setPwErr("Passwords do not match");
      setPwLoading(false);
      return;
    }
    try {
      await axiosInstance.put("/users/me/password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      setPwMsg("Password changed. Please log in again.");
      setPasswords({ current: "", new: "", confirm: "" });
      if (typeof logout === "function") logout();
    } catch (err) {
      setPwErr(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwLoading(false);
      setTimeout(() => setPwMsg(""), 2000);
    }
  };

  const handleEmailPrefChange = (e) => {
    setEmailPrefs((p) => ({ ...p, [e.target.name]: e.target.checked }));
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    setDeleteLoading(true);
    setDeleteErr("");
    setDeleteMsg("");
    try {
      await axiosInstance.delete("/users/me");
      setDeleteMsg("Account deleted successfully");
      if (typeof logout === "function") logout();
    } catch (err) {
      setDeleteErr(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Theme */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Theme</h2>
        <div className="max-w-xs">
          <select
            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-zinc-900 dark:border-zinc-700"
            value={theme}
            onChange={(e) => applyTheme(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Your preference is saved for future visits.
          </p>
        </div>
      </section>

      {/* Profile */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border rounded-md"
              minLength={3}
              maxLength={32}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border rounded-md"
              maxLength={160}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Avatar URL</label>
            <input
              name="avatar"
              value={profile.avatar}
              onChange={handleProfileChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://..."
            />
          </div>
          <button
            type="submit"
            className="bg-gray-900 text-white px-4 py-2 rounded-md mt-2 disabled:opacity-50"
            disabled={profileLoading}
          >
            {profileLoading ? "Saving..." : "Save Profile"}
          </button>
          {profileMsg && (
            <div className="text-green-600 text-sm">{profileMsg}</div>
          )}
          {profileErr && (
            <div className="text-red-600 text-sm">{profileErr}</div>
          )}
        </form>
      </section>

      {/* Change Password (stub) */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">
              Current Password
            </label>
            <input
              name="current"
              type="password"
              value={passwords.current}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input
              name="new"
              type="password"
              value={passwords.new}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border rounded-md"
              minLength={6}
              maxLength={64}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Confirm New Password
            </label>
            <input
              name="confirm"
              type="password"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-gray-900 text-white px-4 py-2 rounded-md mt-2 disabled:opacity-50"
            disabled={pwLoading}
          >
            {pwLoading ? "Saving..." : "Change Password"}
          </button>
          {pwMsg && <div className="text-green-600 text-sm">{pwMsg}</div>}
          {pwErr && <div className="text-red-600 text-sm">{pwErr}</div>}
        </form>
      </section>

      {/* Email Preferences (stub) */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Email Preferences</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="notifications"
            checked={emailPrefs.notifications}
            onChange={handleEmailPrefChange}
            className="accent-gray-900"
          />
          Receive email notifications
        </label>
        <div className="text-xs text-gray-500 mt-1">
          (Stub: not yet connected to backend)
        </div>
      </section>

      {/* Danger Zone (stub) */}
      <section>
        <h2 className="text-lg font-semibold mb-2 text-red-700">Danger Zone</h2>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          disabled={deleteLoading}
        >
          {deleteLoading ? "Deleting..." : "Delete Account"}
        </button>
        {deleteMsg && (
          <div className="text-green-600 text-sm mt-2">{deleteMsg}</div>
        )}
        {deleteErr && (
          <div className="text-red-600 text-sm mt-2">{deleteErr}</div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          This action is irreversible.
        </div>
      </section>
    </div>
  );
}
