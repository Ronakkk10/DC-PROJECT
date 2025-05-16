import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, LogOut, Package } from "lucide-react";
import { logEvent } from "../utils/LogEvent";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (user) {
      logEvent(user.id, "logout", { username: user.username });
    }
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              EShop
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome,{" "}
                  <span className="font-medium text-gray-900">
                    {user.username}
                  </span>
                </span>

                <div className="flex items-center space-x-2">
                  <Link
                    to="/"
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Products"
                  >
                    <Package className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/wishlist"
                    className="p-2 text-gray-600 hover:text-rose-600 transition-colors"
                    title="Wishlist"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/cart"
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Cart"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
