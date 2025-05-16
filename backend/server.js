const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();
const amqp = require("amqplib");
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(bodyParser.json());
// MongoDB Connection
mongoose
  .connect("mongodb://mongo:27017/eshop", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Separate connection for logsdb (for fetching logs)
const logsConnection = mongoose.createConnection(
  "mongodb://mongo:27017/logsdb",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

logsConnection.on("connected", () => {
  console.log("MongoDB LOGS Connected");
});

logsConnection.on("error", (err) => {
  console.log("MongoDB LOGS Connection Error:", err);
});

// Define EventLog model only for this logs connection
const EventLog = logsConnection.model(
  "EventLog",
  new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: { type: String, required: true },
    details: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
  })
);

// RabbitMQ Setup
let channel, connection;

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect("amqp://rabbitmq");
    channel = await connection.createChannel();
    await channel.assertQueue("event_logs");
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err);
  }
}

connectRabbitMQ();
// Models
// User Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
    },
  ],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
});
const User = mongoose.model("User", userSchema);
// Product Model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 10 },
});
const Product = mongoose.model("Product", productSchema);
// Routes
// User Registration
app.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Create new user
    const user = new User({ username, password, email });
    await user.save();
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// User Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check password (simple implementation without encryption)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Get Products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Add sample products (for testing)
app.post("/add-sample-products", async (req, res) => {
  try {
    const sampleProducts = [
      {
        name: "Smartphone",
        description: "Latest model with advanced features",
        price: 699.99,
        image:
          "https://plus.unsplash.com/premium_photo-1680985551009-05107cd2752c?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Electronics",
        stock: 15,
      },
      {
        name: "Laptop",
        description: "Powerful laptop for work and gaming",
        price: 1299.99,
        image:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bGFwdG9wfGVufDB8fDB8fHww",
        category: "Electronics",
        stock: 8,
      },
      {
        name: "Headphones",
        description: "Noise-cancelling wireless headphones",
        price: 199.99,
        image:
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=2065&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Audio",
        stock: 20,
      },
      {
        name: "Smart Watch",
        description: "Track fitness and receive notifications",
        price: 249.99,
        image:
          "https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Wearables",
        stock: 12,
      },
      {
        name: "Bluetooth Speaker",
        description: "Portable speaker with deep bass",
        price: 89.99,
        image:
          "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Audio",
        stock: 25,
      },
      {
        name: "Gaming Console",
        description: "Next-gen console with stunning graphics",
        price: 499.99,
        image:
          "https://images.unsplash.com/flagged/photo-1580234748052-2c23d8b27a71?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGdhbWluZyUyMGNvbnNvbGV8ZW58MHx8MHx8fDA%3D",
        category: "Gaming",
        stock: 10,
      },
      {
        name: "4K Television",
        description: "Ultra HD Smart TV with HDR support",
        price: 999.99,
        image:
          "https://images.unsplash.com/photo-1614696131965-cc559b1ecad1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGVkJTIwdHZ8ZW58MHx8MHx8fDA%3D",
        category: "Electronics",
        stock: 6,
      },
      {
        name: "Tablet",
        description: "Lightweight tablet for entertainment and work",
        price: 329.99,
        image:
          "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8dGFibGV0fGVufDB8fDB8fHww",
        category: "Electronics",
        stock: 18,
      },
      {
        name: "Wireless Mouse",
        description: "Ergonomic and responsive mouse",
        price: 29.99,
        image:
          "https://images.unsplash.com/photo-1707592691247-5c3a1c7ba0e3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d2lyZWxlc3MlMjBtb3VzZXxlbnwwfHwwfHx8MA%3D%3D",
        category: "Accessories",
        stock: 40,
      },
      {
        name: "Mechanical Keyboard",
        description: "Tactile switches with RGB lighting",
        price: 109.99,
        image:
          "https://images.unsplash.com/photo-1520092352425-9699926a9b0b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Accessories",
        stock: 22,
      },
      {
        name: "Fitness Tracker",
        description: "Monitor heart rate, steps, and sleep",
        price: 59.99,
        image:
          "https://images.unsplash.com/photo-1686657984027-3f738de9fcbe?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Wearables",
        stock: 30,
      },
      {
        name: "Drone",
        description: "Compact drone with HD camera and GPS",
        price: 349.99,
        image:
          "https://plus.unsplash.com/premium_photo-1714618849685-89cad85746b1?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Gadgets",
        stock: 5,
      },
    ];
    await Product.insertMany(sampleProducts);
    res.status(201).json({ message: "Sample products added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Get user's cart
app.get("/cart/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "cart.product"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Add to cart
app.post("/cart/add", async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if product already in cart
    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    if (cartItemIndex > -1) {
      // Increment quantity if already in cart
      user.cart[cartItemIndex].quantity += quantity;
    } else {
      // Add new product to cart
      user.cart.push({ product: productId, quantity });
    }
    await user.save();
    res.status(200).json({ message: "Product added to cart", cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Remove from cart
app.post("/cart/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );
    await user.save();
    res
      .status(200)
      .json({ message: "Product removed from cart", cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Clear cart
app.post("/cart/clear", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.cart = [];
    await user.save();
    res.status(200).json({ message: "Cart cleared", cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Get user's wishlist
app.get("/wishlist/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("wishlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Add to wishlist
app.post("/wishlist/add", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if product already in wishlist
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    res
      .status(200)
      .json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Remove from wishlist
app.post("/wishlist/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== productId
    );
    await user.save();
    res.status(200).json({
      message: "Product removed from wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Move from wishlist to cart
app.post("/wishlist-to-cart", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Remove from wishlist
    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== productId
    );
    // Add to cart
    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    if (cartItemIndex > -1) {
      // Increment quantity if already in cart
      user.cart[cartItemIndex].quantity += 1;
    } else {
      // Add new product to cart
      user.cart.push({ product: productId, quantity: 1 });
    }
    await user.save();
    res.status(200).json({
      message: "Product moved from wishlist to cart",
      wishlist: user.wishlist,
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Move from cart to wishlist
app.post("/cart-to-wishlist", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Remove from cart
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );
    // Add to wishlist if not already there
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
    }
    await user.save();
    res.status(200).json({
      message: "Product moved from cart to wishlist",
      cart: user.cart,
      wishlist: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/log", async (req, res) => {
  try {
    const { userId, eventType, details, timestamp } = req.body;

    // Basic validation (optional but recommended)
    if (!userId || !eventType || !timestamp) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const logPayload = {
      userId,
      eventType,
      details,
      timestamp,
    };

    console.log("Event logged successfully:", logPayload);

    // Send log data to RabbitMQ queue
    channel.sendToQueue("event_logs", Buffer.from(JSON.stringify(logPayload)));

    res.status(200).json({ message: "Event queued for logging" });
  } catch (err) {
    console.error("Logging Error:", err);
    res.status(500).json({ message: "Failed to send log", error: err.message });
  }
});

// Get all users with populated cart and wishlist products (admin only)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password") // Exclude passwords
      .populate({
        path: "cart.product",
        select: "name price image category stock", // Only include these product fields
      })
      .populate({
        path: "wishlist",
        select: "name price image category stock", // Only include these product fields
      });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single user by ID with populated data
app.get("/users/:userId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate({
        path: "cart.product",
        select: "name price image category stock",
      })
      .populate({
        path: "wishlist",
        select: "name price image category stock",
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/logs", async (req, res) => {
  try {
    // Step 1: Fetch all logs (no population)
    const logs = await EventLog.find().sort({ timestamp: -1 }).lean();

    // Step 2: Extract unique userIds and productIds
    const userIds = logs.map((log) => log.userId?.toString()).filter(Boolean);
    const productIds = logs
      .map((log) => log.details?.productId?.toString())
      .filter(Boolean);

    const uniqueUserIds = [...new Set(userIds)];
    const uniqueProductIds = [...new Set(productIds)];

    // Step 3: Manually fetch users and products
    const [users, products] = await Promise.all([
      User.find({ _id: { $in: uniqueUserIds } })
        .select("_id username email")
        .lean(),
      Product.find({ _id: { $in: uniqueProductIds } })
        .select("_id name price image category stock")
        .lean(),
    ]);

    // Step 4: Build lookup maps
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
    const productMap = Object.fromEntries(
      products.map((p) => [p._id.toString(), p])
    );

    // Step 5: Format logs
    const formattedLogs = logs.map((log) => {
      const response = {
        _id: log._id,
        eventType: log.eventType,
        details: null,
        timestamp: log.timestamp,
        user: userMap[log.userId?.toString()] || null,
        __v: log.__v,
      };

      if (log.details) {
        response.details = { ...log.details };

        const product = productMap[log.details.productId?.toString()];
        if (product) {
          response.details.product = product;
          delete response.details.productId;
        }
      }

      return response;
    });

    res.status(200).json(formattedLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
