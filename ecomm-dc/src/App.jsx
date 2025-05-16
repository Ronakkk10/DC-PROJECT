import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/LoginSignup";
import Products from "./components/ProductList";
import Wishlist from "./components/Wishlist";
import Cart from "./components/Cart";
import { logEvent } from "./utils/LogEvent";

function App() {
  const [user, setUser] = useState(null);

  // Check if user is logged in from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        logEvent(parsedUser.id, "app_load", { username: parsedUser.username });
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar user={user} setUser={setUser} />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Products user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart user={user} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
