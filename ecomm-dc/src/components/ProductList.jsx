import React, { useState, useEffect } from "react";
import { logEvent } from "../utils/LogEvent";
import { getAPIUrl } from "../utils/routing";
import { ProductSkeleton } from "../utils/ProductSkeleton";
import ProductHeader from "./ProductsHeader";
import ProductCard from "./ProductCard";

const Products = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch products and user's wishlist/cart
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch(getAPIUrl("/products"));
        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Fetch wishlist
        const wishlistResponse = await fetch(getAPIUrl(`/wishlist/${user.id}`));
        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          setWishlist(wishlistData);
        }

        // Fetch cart
        const cartResponse = await fetch(getAPIUrl(`/cart/${user.id}`));
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          setCart(cartData);
        }

        // Log page view
        logEvent(user.id, "view_products_page", {});
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some((item) => {
      return typeof item === "object" && item._id
        ? item._id === productId
        : item === productId;
    });
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return cart.some(
      (item) => item.product._id === productId || item.product === productId
    );
  };

  // Add to wishlist
  const addToWishlist = async (product) => {
    try {
      const response = await fetch(getAPIUrl("/wishlist/add"), {
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
        throw new Error("Failed to add to wishlist");
      }

      // Update local state
      setWishlist([...wishlist, product]);

      // Log event
      logEvent(user.id, "add_to_wishlist", {
        productId: product._id,
        productName: product.name,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Add to cart
  const addToCart = async (product) => {
    try {
      const response = await fetch(getAPIUrl("/cart/add"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId: product._id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      // Update local state
      const existingItemIndex = cart.findIndex(
        (item) =>
          item.product._id === product._id || item.product === product._id
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += 1;
        setCart(updatedCart);
      } else {
        setCart([...cart, { product, quantity: 1 }]);
      }

      // Log event
      logEvent(user.id, "add_to_cart", {
        productId: product._id,
        productName: product.name,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [...new Set(products.map((product) => product.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-blue-600">
            All Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="h-20 w-20 mx-auto mb-6 flex items-center justify-center bg-red-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Products
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <ProductHeader
          title="All Products"
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 mx-auto mb-6 flex items-center justify-center bg-blue-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-1">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isInWishlist={isInWishlist(product._id)}
                isInCart={isInCart(product._id)}
                onAddToWishlist={() => addToWishlist(product)}
                onAddToCart={() => addToCart(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
