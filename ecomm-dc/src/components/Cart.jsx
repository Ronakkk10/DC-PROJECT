import React, { useState, useEffect } from "react";
import { ShoppingCart, Heart, Trash2, Plus, Minus, Check } from "lucide-react";
import { logEvent } from "../utils/LogEvent";
import { getAPIUrl } from "../utils/routing"; // Adjust the import path as necessary

const Cart = ({ user }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Fetch user's cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch(getAPIUrl(`/cart/${user.id}`));
        if (!response.ok) {
          throw new Error("Failed to fetch cart");
        }
        const data = await response.json();
        setCart(data);

        // Calculate total price
        const total = data.reduce((sum, item) => {
          const price = item.product.price || 0;
          const quantity = item.quantity || 1;
          return sum + price * quantity;
        }, 0);
        setTotalPrice(total);

        // Log page view
        logEvent(user.id, "view_cart_page", {});
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user.id]);

  // Remove from cart
  const removeFromCart = async (productId) => {
    try {
      const response = await fetch(getAPIUrl("/cart/remove"), {
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
        throw new Error("Failed to remove from cart");
      }

      // Update local state
      const updatedCart = cart.filter((item) => item.product._id !== productId);
      setCart(updatedCart);

      // Recalculate total price
      const total = updatedCart.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);
      setTotalPrice(total);

      // Log event
      logEvent(user.id, "remove_from_cart", { productId });
    } catch (err) {
      console.error(err);
    }
  };

  // Move to wishlist
  const moveToWishlist = async (productId) => {
    try {
      const response = await fetch(getAPIUrl("/cart-to-wishlist"), {
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
        throw new Error("Failed to move to wishlist");
      }

      // Update local state
      const productToMove = cart.find((item) => item.product._id === productId);
      const updatedCart = cart.filter((item) => item.product._id !== productId);
      setCart(updatedCart);

      // Recalculate total price
      const total = updatedCart.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);
      setTotalPrice(total);

      // Log event
      logEvent(user.id, "move_from_cart_to_wishlist", {
        productId,
        productName: productToMove?.product.name,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Place order
  const placeOrder = async () => {
    try {
      if (cart.length === 0) return;

      const response = await fetch(getAPIUrl("/cart/clear"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      // Log event with ordered items
      const orderDetails = {
        items: cart.map((item) => ({
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalPrice,
      };

      logEvent(user.id, "place_order", orderDetails);

      // Show confirmation modal
      setShowModal(true);

      // Clear cart locally
      setCart([]);
      setTotalPrice(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Update quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      // Remove item if quantity is 0
      if (newQuantity === 0) {
        await removeFromCart(productId);
        return;
      }

      // Otherwise update the product in the cart
      // First remove the item
      await fetch(getAPIUrl("/cart/remove"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
        }),
      });

      // Then add it back with the new quantity
      await fetch(getAPIUrl("/cart/add"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
          quantity: newQuantity,
        }),
      });

      // Update local state
      const updatedCart = cart.map((item) => {
        if (item.product._id === productId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      setCart(updatedCart);

      // Recalculate total price
      const total = updatedCart.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);
      setTotalPrice(total);

      // Log event
      logEvent(user.id, "update_cart_quantity", { productId, newQuantity });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-blue-600">Loading cart...</div>
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
        <h2 className="text-3xl font-bold text-gray-900">Shopping Cart</h2>
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-medium text-gray-600">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-500 mb-6">
            Add items to your cart to continue shopping
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.product._id} className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.product.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${item.product.price.toFixed(2)} each
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product._id,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product._id,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.product.stock}
                              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => moveToWishlist(item.product._id)}
                              className="flex items-center text-sm text-gray-600 hover:text-rose-600"
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              Save for later
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product._id)}
                              className="flex items-center text-sm text-gray-600 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={placeOrder}
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Order Placed Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. Your order has been received and is
                being processed.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
