import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { logEvent } from "../utils/LogEvent";
import { getAPIUrl } from "../utils/routing";

const Wishlist = ({ user }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch(getAPIUrl(`/wishlist/${user.id}`));
        if (!response.ok) {
          throw new Error("Failed to fetch wishlist");
        }
        const data = await response.json();
        setWishlist(data);

        // Log page view
        logEvent(user.id, "view_wishlist_page", {});
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user.id]);

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(getAPIUrl("/wishlist/remove"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove from wishlist");
      }

      // Update local state
      setWishlist(
        wishlist.filter((item) => {
          const itemId = item._id || item;
          return itemId !== productId;
        })
      );

      // Log event
      logEvent(user.id, "remove_from_wishlist", { productId });
    } catch (err) {
      console.error(err);
    }
  };

  // Move to cart
  const moveToCart = async (product) => {
    try {
      const response = await fetch(getAPIUrl("/wishlist-to-cart"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId: product._id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to move to cart");
      }

      // Update local state
      setWishlist(
        wishlist.filter((item) => {
          const itemId = item._id || item;
          return itemId !== product._id;
        })
      );

      // Log event
      logEvent(user.id, "move_from_wishlist_to_cart", {
        productId: product._id,
        productName: product.name,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-blue-600">Loading wishlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Wishlist</h2>
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-rose-500" />
          <span className="text-lg font-medium text-gray-600">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-500 mb-6">
            Start adding items to your wishlist!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product._id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <div className="relative h-60 bg-gray-50">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {product.category}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      product.stock > 10
                        ? "bg-green-100 text-green-800"
                        : product.stock > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock > 10
                      ? "In Stock"
                      : product.stock > 0
                      ? `${product.stock} left`
                      : "Out of Stock"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => moveToCart(product)}
                    disabled={product.stock === 0}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                      product.stock === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Move to Cart</span>
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product._id)}
                    className="p-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
