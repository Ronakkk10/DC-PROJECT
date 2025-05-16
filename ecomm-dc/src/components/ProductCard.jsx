import React from "react";
import { Heart, ShoppingCart, Check } from "lucide-react";

const ProductCard = ({
  product,
  isInWishlist,
  isInCart,
  onAddToWishlist,
  onAddToCart,
}) => {
  const getStockIndicator = () => {
    if (product.stock > 10) {
      return { text: "In Stock", color: "bg-green-100 text-green-800" };
    } else if (product.stock > 0) {
      return {
        text: `Only ${product.stock} left`,
        color: "bg-amber-100 text-amber-800",
      };
    } else {
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    }
  };

  const stockIndicator = getStockIndicator();

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full border border-gray-100">
      {/* Badge for category */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {product.category}
        </span>
      </div>

      {/* Wishlist button - top right */}
      <button
        onClick={onAddToWishlist}
        disabled={isInWishlist}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full ${
          isInWishlist
            ? "bg-rose-100 text-rose-500"
            : "bg-white/80 text-gray-500 hover:bg-white hover:text-rose-500"
        } shadow-sm transition-all duration-200`}
        aria-label={isInWishlist ? "Already in wishlist" : "Add to wishlist"}
      >
        <Heart className={`h-5 w-5 ${isInWishlist ? "fill-rose-500" : ""}`} />
      </button>

      {/* Image container with zoom effect */}
      <div className="relative h-60 bg-gray-50 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product details */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="mb-auto">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>

        <div className="mt-4">
          {/* Stock indicator */}
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs py-1 px-2 rounded-full ${stockIndicator.color}`}
            >
              {stockIndicator.text}
            </span>
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!isInCart ? (
              <button
                onClick={onAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                  product.stock === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart</span>
              </button>
            ) : (
              <button
                disabled
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-green-600 text-white flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>In Cart</span>
              </button>
            )}

            {!isInWishlist ? (
              <button
                onClick={onAddToWishlist}
                className="py-2.5 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
              >
                Wishlist
              </button>
            ) : (
              <button
                disabled
                className="py-2.5 px-4 rounded-lg bg-rose-100 text-rose-600 text-sm font-medium"
              >
                Wishlisted
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
