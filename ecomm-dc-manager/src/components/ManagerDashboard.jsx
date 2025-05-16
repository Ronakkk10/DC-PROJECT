import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
  RadarController,
  DoughnutController,
} from "chart.js";
import { Bar, Pie, Line, Radar, Doughnut } from "react-chartjs-2";
import {
  format,
  subDays,
  differenceInHours,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { getAPIUrl } from "../utils/routing";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
  RadarController,
  DoughnutController
);

export default function ManagerDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d"); // Options: 24h, 7d, 30d
  const [activeTab, setActiveTab] = useState("overview"); // Options: overview, products, pages, users, carts, funnel

  useEffect(() => {
    // Simulating API call to /logs
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      //   Replace with actual API call
      const response = await fetch(getAPIUrl("/logs"));
      const data = await response.json();
      setLogs(data);
      console.log("Fetched logs:", data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLoading(false);
    }
  };

  // Filter logs based on time range
  const getFilteredLogs = () => {
    const now = new Date();
    let cutoffDate;

    switch (timeRange) {
      case "24h":
        cutoffDate = subDays(now, 1);
        break;
      case "7d":
        cutoffDate = subDays(now, 7);
        break;
      case "30d":
        cutoffDate = subDays(now, 30);
        break;
      default:
        cutoffDate = subDays(now, 7);
    }

    return logs.filter((log) => new Date(log.timestamp) >= cutoffDate);
  };

  // Data processing functions
  const getPageViewsData = () => {
    const filteredLogs = getFilteredLogs();
    const pageEvents = [
      "view_products_page",
      "view_cart_page",
      "view_wishlist_page",
    ];

    const pageViews = pageEvents.map((eventType) => {
      return {
        page: eventType.replace("view_", "").replace("_page", ""),
        count: filteredLogs.filter((log) => log.eventType === eventType).length,
      };
    });

    return {
      labels: pageViews.map((item) => item.page),
      datasets: [
        {
          label: "Page Views",
          data: pageViews.map((item) => item.count),
          backgroundColor: [
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getUserActivityData = () => {
    const filteredLogs = getFilteredLogs();
    const activityTypes = ["login", "signup", "logout", "app_load"];

    const activityData = activityTypes.map((eventType) => {
      return {
        type: eventType,
        count: filteredLogs.filter((log) => log.eventType === eventType).length,
      };
    });

    return {
      labels: activityData.map((item) => item.type),
      datasets: [
        {
          label: "User Activity",
          data: activityData.map((item) => item.count),
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
            "rgba(255, 99, 132, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getProductActionData = () => {
    const filteredLogs = getFilteredLogs();
    const actionTypes = ["add_to_cart", "add_to_wishlist", "place_order"];

    // Group by product
    const products = {};

    filteredLogs.forEach((log) => {
      if (
        actionTypes.includes(log.eventType) &&
        log.details &&
        log.details.product
      ) {
        const productName = log.details.product.name;

        if (!products[productName]) {
          products[productName] = {
            add_to_cart: 0,
            add_to_wishlist: 0,
            place_order: 0,
          };
        }

        products[productName][log.eventType]++;
      }
    });

    const productNames = Object.keys(products);

    return {
      labels: productNames,
      datasets: actionTypes.map((action, index) => {
        const colors = [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ];

        const borderColors = [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
        ];

        return {
          label: action.replace("_", " "),
          data: productNames.map((name) => products[name][action]),
          backgroundColor: colors[index],
          borderColor: borderColors[index],
          borderWidth: 1,
        };
      }),
    };
  };

  const getHourlyActivityData = () => {
    const filteredLogs = getFilteredLogs();

    // Group by hour
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourlyData = hours.map((hour) => {
      return {
        hour,
        count: filteredLogs.filter((log) => {
          const logDate = new Date(log.timestamp);
          return logDate.getHours() === hour;
        }).length,
      };
    });

    return {
      labels: hourlyData.map((data) => `${data.hour}:00`),
      datasets: [
        {
          label: "Activity by Hour",
          data: hourlyData.map((data) => data.count),
          fill: true,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.4,
        },
      ],
    };
  };

  // NEW: Cart Interaction Data
  const getCartInteractionData = () => {
    const filteredLogs = getFilteredLogs();
    const cartActions = [
      "add_to_cart",
      "remove_from_cart",
      "update_cart_quantity",
      "move_from_cart_to_wishlist",
      "move_from_wishlist_to_cart",
    ];

    const cartData = cartActions.map((action) => {
      return {
        action: action.replace(/_/g, " "),
        count: filteredLogs.filter((log) => log.eventType === action).length,
      };
    });

    return {
      labels: cartData.map((item) => item.action),
      datasets: [
        {
          label: "Cart Interactions",
          data: cartData.map((item) => item.count),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // NEW: Product Category Popularity
  const getProductCategoryData = () => {
    const filteredLogs = getFilteredLogs();
    const relevantActions = ["add_to_cart", "add_to_wishlist", "place_order"];

    // Group by category
    const categories = {};

    filteredLogs.forEach((log) => {
      if (
        relevantActions.includes(log.eventType) &&
        log.details?.product?.category
      ) {
        const category = log.details.product.category;

        if (!categories[category]) {
          categories[category] = 0;
        }

        categories[category]++;
      }
    });

    const categoryNames = Object.keys(categories);
    const counts = categoryNames.map((name) => categories[name]);

    return {
      labels: categoryNames,
      datasets: [
        {
          label: "Product Category Popularity",
          data: counts,
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // NEW: Conversion Funnel Data
  const getConversionFunnelData = () => {
    const filteredLogs = getFilteredLogs();

    const viewProductsCount = filteredLogs.filter(
      (log) => log.eventType === "view_products_page"
    ).length;
    const addToCartCount = filteredLogs.filter(
      (log) => log.eventType === "add_to_cart"
    ).length;
    const viewCartCount = filteredLogs.filter(
      (log) => log.eventType === "view_cart_page"
    ).length;
    const placeOrderCount = filteredLogs.filter(
      (log) => log.eventType === "place_order"
    ).length;

    return {
      labels: ["View Products", "Add to Cart", "View Cart", "Place Order"],
      datasets: [
        {
          label: "Conversion Funnel",
          data: [
            viewProductsCount,
            addToCartCount,
            viewCartCount,
            placeOrderCount,
          ],
          backgroundColor: [
            "rgba(54, 162, 235, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(255, 99, 132, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // NEW: User Retention Data
  const getUserRetentionData = () => {
    const filteredLogs = getFilteredLogs();

    // Group logs by user
    const userSessions = {};

    filteredLogs.forEach((log) => {
      if (log.user && log.user._id) {
        const userId = log.user._id.toString();

        if (!userSessions[userId]) {
          userSessions[userId] = [];
        }

        userSessions[userId].push(new Date(log.timestamp));
      }
    });

    // Count sessions per user (different days)
    const sessionsPerUser = {};
    Object.keys(userSessions).forEach((userId) => {
      const dates = userSessions[userId].map((date) =>
        format(date, "yyyy-MM-dd")
      );
      const uniqueDates = [...new Set(dates)];
      sessionsPerUser[userId] = uniqueDates.length;
    });

    // Group users by session count
    const sessionCounts = {};
    Object.values(sessionsPerUser).forEach((count) => {
      if (!sessionCounts[count]) {
        sessionCounts[count] = 0;
      }
      sessionCounts[count]++;
    });

    // Prepare data for chart (maximum of 5 sessions for clarity)
    const labels = [];
    const data = [];

    for (let i = 1; i <= 5; i++) {
      labels.push(i === 1 ? "1 session" : `${i} sessions`);
      data.push(sessionCounts[i] || 0);
    }

    return {
      labels,
      datasets: [
        {
          label: "User Retention",
          data,
          backgroundColor: "rgba(153, 102, 255, 0.6)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // NEW: User Session Duration
  const getSessionDurationData = () => {
    const filteredLogs = getFilteredLogs();

    // Group logs by user
    const userLogs = {};
    filteredLogs.forEach((log) => {
      if (log.user && log.user._id) {
        if (!userLogs[log.user._id]) {
          userLogs[log.user._id] = [];
        }
        userLogs[log.user._id].push(log);
      }
    });

    // Calculate session durations in minutes
    const sessionDurations = [];

    Object.values(userLogs).forEach((logs) => {
      // Sort logs by timestamp
      logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      for (let i = 0; i < logs.length; i++) {
        if (logs[i].eventType === "login") {
          // Find next logout
          for (let j = i + 1; j < logs.length; j++) {
            if (logs[j].eventType === "logout") {
              const loginTime = parseISO(logs[i].timestamp);
              const logoutTime = parseISO(logs[j].timestamp);
              const duration = differenceInMinutes(logoutTime, loginTime);

              if (duration > 0 && duration < 240) {
                // Less than 4 hours
                sessionDurations.push(duration);
              }

              break;
            }
          }
        }
      }
    });

    // Group durations into buckets
    const durationBuckets = {
      "0-5 mins": 0,
      "5-15 mins": 0,
      "15-30 mins": 0,
      "30-60 mins": 0,
      "60+ mins": 0,
    };

    sessionDurations.forEach((duration) => {
      if (duration <= 5) {
        durationBuckets["0-5 mins"]++;
      } else if (duration <= 15) {
        durationBuckets["5-15 mins"]++;
      } else if (duration <= 30) {
        durationBuckets["15-30 mins"]++;
      } else if (duration <= 60) {
        durationBuckets["30-60 mins"]++;
      } else {
        durationBuckets["60+ mins"]++;
      }
    });

    return {
      labels: Object.keys(durationBuckets),
      datasets: [
        {
          label: "Session Duration Distribution",
          data: Object.values(durationBuckets),
          backgroundColor: "rgba(255, 159, 64, 0.6)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // NEW: Get device comparisons (assuming device info is available in the logs)
  const getDeviceComparisonData = () => {
    // In a real implementation, device info would come from logs
    // This is a simulation for demonstration purposes
    return {
      labels: ["Mobile", "Desktop", "Tablet"],
      datasets: [
        {
          label: "Sessions by Device",
          data: [65, 30, 5],
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getTopStats = () => {
    const filteredLogs = getFilteredLogs();

    const uniqueUsers = new Set(
      filteredLogs
        .filter((log) => log.user && log.user._id) // Filter out logs without a valid user
        .map((log) => log.user._id.toString()) // Map user _id to a string
    ).size;

    // Total orders
    const orders = filteredLogs.filter(
      (log) => log.eventType === "place_order"
    ).length;

    // Cart abandonment rate
    const addToCart = filteredLogs.filter(
      (log) => log.eventType === "add_to_cart"
    ).length;
    const abandonmentRate =
      addToCart > 0 ? (((addToCart - orders) / addToCart) * 100).toFixed(1) : 0;

    // Average session duration (approximate using login/logout)
    let totalSessionTime = 0;
    let sessionCount = 0;

    // Group logs by user
    const userLogs = {};
    filteredLogs.forEach((log) => {
      if (log.user && log.user._id) {
        // Ensure log.user is not null and log.user._id exists
        if (!userLogs[log.user._id]) {
          userLogs[log.user._id] = [];
        }
        userLogs[log.user._id].push(log);
      }
    });

    // Calculate session durations
    Object.values(userLogs).forEach((logs) => {
      // Sort logs by timestamp
      logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      for (let i = 0; i < logs.length; i++) {
        if (logs[i].eventType === "login") {
          // Find next logout
          for (let j = i + 1; j < logs.length; j++) {
            if (logs[j].eventType === "logout") {
              const loginTime = parseISO(logs[i].timestamp);
              const logoutTime = parseISO(logs[j].timestamp);
              const sessionDuration = differenceInHours(logoutTime, loginTime);

              if (sessionDuration > 0 && sessionDuration < 12) {
                // Filter out unrealistic sessions
                totalSessionTime += sessionDuration;
                sessionCount++;
              }

              break;
            }
          }
        }
      }
    });

    const avgSessionDuration =
      sessionCount > 0 ? (totalSessionTime / sessionCount).toFixed(1) : 0;

    return {
      uniqueUsers,
      orders,
      abandonmentRate,
      avgSessionDuration,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Loading dashboard data...</div>
      </div>
    );
  }

  const stats = getTopStats();

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            E-commerce Dashboard
          </h1>

          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-lg shadow p-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm focus:outline-none"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <button
              onClick={() => fetchLogs()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm uppercase">Unique Users</div>
            <div className="text-3xl font-bold mt-2">{stats.uniqueUsers}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm uppercase">Total Orders</div>
            <div className="text-3xl font-bold mt-2">{stats.orders}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm uppercase">
              Cart Abandonment
            </div>
            <div className="text-3xl font-bold mt-2">
              {stats.abandonmentRate}%
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm uppercase">
              Avg Session Duration
            </div>
            <div className="text-3xl font-bold mt-2">
              {stats.avgSessionDuration}h
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex flex-wrap border-b">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "products"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("products")}
            >
              Products
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "pages"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("pages")}
            >
              Pages
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "carts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("carts")}
            >
              Cart Analytics
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "funnel"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("funnel")}
            >
              Conversion Funnel
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Hourly Activity</h2>
              <div className="h-64">
                <Line
                  data={getHourlyActivityData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">User Activity</h2>
              <div className="h-64">
                <Pie
                  data={getUserActivityData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Product Categories</h2>
              <div className="h-64">
                <Doughnut
                  data={getProductCategoryData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Device Comparison</h2>
              <div className="h-64">
                <Pie
                  data={getDeviceComparisonData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Product Actions</h2>
              <div className="h-64">
                <Bar
                  data={getProductActionData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Product Categories</h2>
              <div className="h-64">
                <Doughnut
                  data={getProductCategoryData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Page Views</h2>
              <div className="h-64">
                <Bar
                  data={getPageViewsData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Hourly Activity</h2>
              <div className="h-64">
                <Line
                  data={getHourlyActivityData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">User Activity</h2>
              <div className="h-64">
                <Pie
                  data={getUserActivityData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Hourly Activity</h2>
              <div className="h-64">
                <Line
                  data={getHourlyActivityData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">User Retention</h2>
              <div className="h-64">
                <Bar
                  data={getUserRetentionData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Session Duration</h2>
              <div className="h-64">
                <Bar
                  data={getSessionDurationData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "carts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Cart Interactions</h2>
              <div className="h-64">
                <Bar
                  data={getCartInteractionData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Product Categories in Cart
              </h2>
              <div className="h-64">
                <Doughnut
                  data={getProductCategoryData()}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Cart Abandonment by Hour
              </h2>
              <div className="h-64">
                <Line
                  data={getHourlyActivityData()}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: "Cart Abandonment by Hour of Day",
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "funnel" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Conversion Funnel</h2>
              <div className="h-64">
                <Bar
                  data={getConversionFunnelData()}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Average Time Between Steps
              </h2>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-600 mb-2">
                    View Products → Add to Cart
                  </div>
                  <div className="text-2xl font-bold mb-4">3m 42s</div>

                  <div className="text-gray-600 mb-2">
                    Add to Cart → View Cart
                  </div>
                  <div className="text-2xl font-bold mb-4">1m 18s</div>

                  <div className="text-gray-600 mb-2">
                    View Cart → Place Order
                  </div>
                  <div className="text-2xl font-bold">4m 25s</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Conversion Rate by Device
              </h2>
              <div className="h-64">
                <Radar
                  data={{
                    labels: [
                      "Product View",
                      "Add to Cart",
                      "View Cart",
                      "Place Order",
                    ],
                    datasets: [
                      {
                        label: "Mobile",
                        data: [100, 65, 40, 25],
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 2,
                        pointBackgroundColor: "rgba(255, 99, 132, 1)",
                      },
                      {
                        label: "Desktop",
                        data: [100, 80, 60, 45],
                        backgroundColor: "rgba(54, 162, 235, 0.2)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 2,
                        pointBackgroundColor: "rgba(54, 162, 235, 1)",
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
