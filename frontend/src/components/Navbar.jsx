import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900">
          Whisp 🕊️
        </Link>

        <div className="flex gap-4">
          {user ? (
            <>
              <Link to="/timeline" className="text-gray-700 hover:text-gray-900">
                Timeline
              </Link>
              <Link to="/friends" className="text-gray-700 hover:text-gray-900">
                Friends
              </Link>
              <Link to={`/profile/${user._id}`} className="text-gray-700 hover:text-gray-900">
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
              <Link to="/register" className="text-gray-700 hover:text-gray-900">
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
