import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = (searchId || "").trim();
    if (!query) return;

    setSearchError("");
    setIsSearching(true);

    try {
      // Try to search by username first
      const res = await axiosInstance.get(
        `/users/search/${encodeURIComponent(query)}`
      );
      navigate(`/profile/${res.data._id}`);
      setSearchId("");
    } catch (err) {
      // If search fails, check if it's a valid MongoDB ObjectID (24 hex chars)
      if (/^[a-f\d]{24}$/i.test(query)) {
        // Looks like an ID, try navigating directly
        navigate(`/profile/${query}`);
        setSearchId("");
      } else {
        setSearchError(err.response?.data?.message || "User not found");
        setTimeout(() => setSearchError(""), 3000);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900">
          Whisp 🕊️
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <div className="relative hidden sm:block">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Search by username"
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                  disabled={isSearching}
                >
                  {isSearching ? "..." : "Search"}
                </button>
              </form>
              {searchError && (
                <div className="absolute top-full left-0 mt-1 px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-md border border-red-200 whitespace-nowrap">
                  {searchError}
                </div>
              )}
            </div>
          )}
          {user ? (
            <>
              <Link
                to="/timeline"
                className="text-gray-700 hover:text-gray-900"
              >
                Timeline
              </Link>
              <Link to="/friends" className="text-gray-700 hover:text-gray-900">
                Friends
              </Link>
              <Link
                to={`/profile/${user._id}`}
                className="text-gray-700 hover:text-gray-900"
              >
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="text-gray-700 hover:text-gray-900"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
