// controllers/ReportsController.js
import mongoose from "mongoose";
import TourPackage from "../models/TourPackage.js";
import Booking from "../models/Booking.js";
import Blog from "../models/BlogModel.js";
import Meal from "../models/MealModel.js";
import Accommodation from "../models/AccommodationModel.js";
import Vehicle from "../models/vehicleModel.js";
import Feedback from "../models/FeedbackModel.js";
import Complaint from "../models/ComplaintModel.js";
import Inventory from "../models/InventoryModel.js";
import User from "../models/UserModel.js";
import SimpleFinance from "../models/SimpleFinance.js";

// Tour Package Reports
export const getTourPackageReports = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "confirmed" })
      .populate("items.tourPackage", "name price duration")
      .lean();

    // Calculate booking counts and revenue for each tour package
    const packageStats = {};
    
    bookings.forEach(booking => {
      booking.items.forEach(item => {
        if (item.serviceType === "TourPackage" && item.tourPackage) {
          const pkgId = item.tourPackage._id.toString();
          if (!packageStats[pkgId]) {
            packageStats[pkgId] = {
              _id: pkgId,
              name: item.tourPackage.name,
              price: item.tourPackage.price,
              duration: item.tourPackage.duration,
              bookings: 0,
              revenue: 0,
              status: "active"
            };
          }
          packageStats[pkgId].bookings += item.qty || 1;
          packageStats[pkgId].revenue += item.lineTotal || 0;
        }
      });
    });

    const allPackages = await TourPackage.find().lean();
    const packagesWithStats = allPackages.map(pkg => ({
      ...pkg,
      bookings: packageStats[pkg._id.toString()]?.bookings || 0,
      revenue: packageStats[pkg._id.toString()]?.revenue || 0
    }));

    // Sort packages
    const mostBooked = [...packagesWithStats].sort((a, b) => b.bookings - a.bookings).slice(0, 10);
    const leastBooked = [...packagesWithStats].sort((a, b) => a.bookings - b.bookings).slice(0, 10);
    const topRevenue = [...packagesWithStats].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const totalPackages = allPackages.length;
    const totalBookings = Object.values(packageStats).reduce((sum, pkg) => sum + pkg.bookings, 0);
    const totalRevenue = Object.values(packageStats).reduce((sum, pkg) => sum + pkg.revenue, 0);
    const avgBookingRate = totalPackages > 0 ? (totalBookings / totalPackages) : 0;

    res.json({
      mostBooked,
      leastBooked,
      topRevenue,
      totalPackages,
      totalBookings,
      totalRevenue,
      avgBookingRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Blog Reports
export const getBlogReports = async (req, res) => {
  try {
    const blogs = await Blog.find().lean();
    
    // Sort by views/pageviews
    const mostRead = [...blogs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
    const leastRead = [...blogs].sort((a, b) => (a.views || 0) - (b.views || 0)).slice(0, 10);

    const totalPosts = blogs.length;
    const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
    const avgViews = totalPosts > 0 ? totalViews / totalPosts : 0;
    const publishedPosts = blogs.filter(blog => blog.status === "published").length;

    res.json({
      mostRead,
      leastRead,
      totalPosts,
      totalViews,
      avgViews,
      publishedPosts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Meal Reports
export const getMealReports = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "confirmed" })
      .populate("items.meal", "name price category")
      .lean();

    // Calculate order counts for each meal
    const mealStats = {};
    
    bookings.forEach(booking => {
      booking.items.forEach(item => {
        if (item.serviceType === "Meal" && item.meal) {
          const mealId = item.meal._id.toString();
          if (!mealStats[mealId]) {
            mealStats[mealId] = {
              _id: mealId,
              name: item.meal.name,
              price: item.meal.price,
              category: item.meal.category,
              orders: 0,
              status: "available"
            };
          }
          mealStats[mealId].orders += item.qty || 1;
        }
      });
    });

    const allMeals = await Meal.find().lean();
    const mealsWithStats = allMeals.map(meal => ({
      ...meal,
      orders: mealStats[meal._id.toString()]?.orders || 0
    }));

    // Sort meals
    const mostOrdered = [...mealsWithStats].sort((a, b) => b.orders - a.orders).slice(0, 10);
    const leastOrdered = [...mealsWithStats].sort((a, b) => a.orders - b.orders).slice(0, 10);

    const totalMeals = allMeals.length;
    const totalOrders = Object.values(mealStats).reduce((sum, meal) => sum + meal.orders, 0);
    const totalRevenue = Object.values(mealStats).reduce((sum, meal) => sum + (meal.price * meal.orders), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      mostOrdered,
      leastOrdered,
      totalMeals,
      totalOrders,
      totalRevenue,
      avgOrderValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accommodation Reports
export const getAccommodationReports = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "confirmed" })
      .populate("items.accommodation", "name price type")
      .lean();

    // Calculate nights sold for each accommodation
    const accommodationStats = {};
    
    bookings.forEach(booking => {
      booking.items.forEach(item => {
        if (item.serviceType === "Accommodation" && item.accommodation) {
          const accId = item.accommodation._id.toString();
          if (!accommodationStats[accId]) {
            accommodationStats[accId] = {
              _id: accId,
              name: item.accommodation.name,
              price: item.accommodation.price,
              type: item.accommodation.type,
              nightsSold: 0,
              status: "available"
            };
          }
          // Calculate nights based on start and end dates
          if (item.startDate && item.endDate) {
            const start = new Date(item.startDate);
            const end = new Date(item.endDate);
            const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            accommodationStats[accId].nightsSold += nights * (item.qty || 1);
          }
        }
      });
    });

    const allAccommodations = await Accommodation.find().lean();
    const accommodationsWithStats = allAccommodations.map(acc => ({
      ...acc,
      nightsSold: accommodationStats[acc._id.toString()]?.nightsSold || 0
    }));

    // Sort accommodations
    const mostBooked = [...accommodationsWithStats].sort((a, b) => b.nightsSold - a.nightsSold).slice(0, 10);
    const leastBooked = [...accommodationsWithStats].sort((a, b) => a.nightsSold - b.nightsSold).slice(0, 10);

    const totalProperties = allAccommodations.length;
    const totalNights = Object.values(accommodationStats).reduce((sum, acc) => sum + acc.nightsSold, 0);
    const totalRevenue = Object.values(accommodationStats).reduce((sum, acc) => sum + (acc.price * acc.nightsSold), 0);
    const avgOccupancy = totalProperties > 0 ? (totalNights / totalProperties) : 0;

    res.json({
      mostBooked,
      leastBooked,
      totalProperties,
      totalNights,
      totalRevenue,
      avgOccupancy
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vehicle Reports
export const getVehicleReports = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "confirmed" })
      .populate("items.vehicle", "brand regNo type price")
      .lean();

    // Calculate rental counts for each vehicle
    const vehicleStats = {};
    
    bookings.forEach(booking => {
      booking.items.forEach(item => {
        if (item.serviceType === "Vehicle" && item.vehicle) {
          const vehicleId = item.vehicle._id.toString();
          if (!vehicleStats[vehicleId]) {
            vehicleStats[vehicleId] = {
              _id: vehicleId,
              name: `${item.vehicle.brand} (${item.vehicle.regNo})`,
              type: item.vehicle.type,
              price: item.vehicle.price,
              rentals: 0,
              status: "Available"
            };
          }
          vehicleStats[vehicleId].rentals += item.qty || 1;
        }
      });
    });

    const allVehicles = await Vehicle.find().lean();
    const vehiclesWithStats = allVehicles.map(vehicle => ({
      ...vehicle,
      name: `${vehicle.brand} (${vehicle.regNo})`,
      rentals: vehicleStats[vehicle._id.toString()]?.rentals || 0
    }));

    // Sort vehicles
    const mostRented = [...vehiclesWithStats].sort((a, b) => b.rentals - a.rentals).slice(0, 10);
    const leastRented = [...vehiclesWithStats].sort((a, b) => a.rentals - b.rentals).slice(0, 10);

    const totalVehicles = allVehicles.length;
    const totalRentals = Object.values(vehicleStats).reduce((sum, vehicle) => sum + vehicle.rentals, 0);
    const totalRevenue = Object.values(vehicleStats).reduce((sum, vehicle) => sum + (vehicle.price * vehicle.rentals), 0);
    const avgRentalValue = totalRentals > 0 ? totalRevenue / totalRentals : 0;

    res.json({
      mostRented,
      leastRented,
      totalVehicles,
      totalRentals,
      totalRevenue,
      avgRentalValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Feedback Reports
export const getFeedbackReports = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().lean();
    
    // Group feedbacks by service/item
    const serviceStats = {};
    
    feedbacks.forEach(feedback => {
      const serviceKey = feedback.serviceType || "General";
      if (!serviceStats[serviceKey]) {
        serviceStats[serviceKey] = {
          name: serviceKey,
          total: 0,
          high: 0, // 4-5 stars
          low: 0   // 1-2 stars
        };
      }
      serviceStats[serviceKey].total++;
      if (feedback.rating >= 4) {
        serviceStats[serviceKey].high++;
      } else if (feedback.rating <= 2) {
        serviceStats[serviceKey].low++;
      }
    });

    // Get most active reviewers
    const reviewerStats = {};
    feedbacks.forEach(feedback => {
      const reviewer = feedback.customerName || "Anonymous";
      reviewerStats[reviewer] = (reviewerStats[reviewer] || 0) + 1;
    });

    const mostActiveReviewers = Object.entries(reviewerStats)
      .map(([name, count]) => ({ customerName: name, feedbackCount: count }))
      .sort((a, b) => b.feedbackCount - a.feedbackCount)
      .slice(0, 10);

    // Get most praised and criticized items
    const mostPraised = Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, rating: stats.high, category: "Service", date: new Date().toISOString().split('T')[0], status: "active" }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    const mostCriticized = Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, rating: stats.low, category: "Service", date: new Date().toISOString().split('T')[0], status: "active" }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    const totalFeedbacks = feedbacks.length;
    const avgRating = totalFeedbacks > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks : 0;
    const responseRate = totalFeedbacks > 0 ? (feedbacks.filter(f => f.response).length / totalFeedbacks) * 100 : 0;
    const activeReviewers = Object.keys(reviewerStats).length;

    res.json({
      mostPraised,
      mostCriticized,
      mostActiveReviewers,
      totalFeedbacks,
      avgRating,
      responseRate,
      activeReviewers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complaint Reports
export const getComplaintReports = async (req, res) => {
  try {
    const complaints = await Complaint.find().lean();
    
    // Group complaints by category and service
    const categoryStats = {};
    const serviceStats = {};
    
    complaints.forEach(complaint => {
      // Category stats
      const category = complaint.category || "General";
      if (!categoryStats[category]) {
        categoryStats[category] = { name: category, count: 0, age: 0, priority: "medium", status: "pending" };
      }
      categoryStats[category].count++;
      
      // Service stats
      const service = complaint.serviceType || "General";
      if (!serviceStats[service]) {
        serviceStats[service] = { name: service, count: 0, age: 0, priority: "medium", status: "pending" };
      }
      serviceStats[service].count++;
    });

    // Get oldest unresolved complaints
    const unresolvedComplaints = complaints
      .filter(c => c.status !== "Resolved")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 10)
      .map(complaint => ({
        name: complaint.subject || "Complaint",
        count: 1,
        days: Math.floor((new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24)),
        priority: complaint.priority || "medium",
        status: complaint.status || "pending"
      }));

    const leastComplainedCategories = Object.entries(categoryStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 10);

    const mostComplainedServices = Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalComplaints = complaints.length;
    const resolvedRate = totalComplaints > 0 ? (complaints.filter(c => c.status === "Resolved").length / totalComplaints) * 100 : 0;
    const avgResolutionTime = totalComplaints > 0 ? complaints.reduce((sum, c) => {
      if (c.status === "Resolved" && c.resolvedAt) {
        return sum + Math.floor((new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
      }
      return sum;
    }, 0) / complaints.filter(c => c.status === "Resolved").length : 0;
    const unresolvedCount = complaints.filter(c => c.status !== "Resolved").length;

    res.json({
      leastComplainedCategories,
      mostComplainedServices,
      oldestUnresolved: unresolvedComplaints,
      totalComplaints,
      resolvedRate,
      avgResolutionTime,
      unresolvedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Inventory Reports
export const getInventoryReports = async (req, res) => {
  try {
    const inventory = await Inventory.find().lean();
    
    // Group by item name for analysis
    const itemStats = {};
    
    inventory.forEach(item => {
      const key = item.name || "Unknown";
      if (!itemStats[key]) {
        itemStats[key] = {
          name: key,
          quantity: 0,
          unitCost: item.unitCost || 0,
          category: item.category || "General",
          status: item.status || "in_stock"
        };
      }
      itemStats[key].quantity += item.quantity || 0;
    });

    // Get fastest moving items (highest quantity)
    const fastestMoving = Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Get most out of stock items
    const mostOutOfStock = Object.values(itemStats)
      .filter(item => item.status === "out_of_stock")
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Get soonest to expire items (within 30 days)
    const soonestToExpire = inventory
      .filter(item => {
        if (!item.expiryDate) return false;
        const daysToExpiry = Math.floor((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysToExpiry <= 30 && daysToExpiry >= 0;
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        category: item.category,
        status: item.status
      }));

    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + ((item.unitCost || 0) * (item.quantity || 0)), 0);
    const lowStockCount = inventory.filter(item => item.quantity < 10).length;
    const expiringSoon = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const daysToExpiry = Math.floor((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysToExpiry <= 30 && daysToExpiry >= 0;
    }).length;

    res.json({
      fastestMoving,
      mostOutOfStock,
      soonestToExpire,
      totalItems,
      totalValue,
      lowStockCount,
      expiringSoon
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User Reports
export const getUserReports = async (req, res) => {
  try {
    const users = await User.find().lean();
    
    // Group by country/region
    const countryStats = {};
    users.forEach(user => {
      const country = user.nationality || "Unknown";
      countryStats[country] = (countryStats[country] || 0) + 1;
    });

    const topCountries = Object.entries(countryStats)
      .map(([country, count]) => ({
        country,
        count,
        percentage: ((count / users.length) * 100).toFixed(1),
        lastActive: new Date().toISOString().split('T')[0],
        status: "active"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by role
    const roleStats = {};
    users.forEach(user => {
      const role = user.role || "Customer";
      roleStats[role] = (roleStats[role] || 0) + 1;
    });

    const moderatorsByRole = Object.entries(roleStats)
      .map(([role, count]) => ({
        role,
        count,
        percentage: ((count / users.length) * 100).toFixed(1),
        lastActive: new Date().toISOString().split('T')[0],
        status: "active"
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate stats
    const totalUsers = users.length;
    const newUsersThisMonth = users.filter(user => {
      const userDate = new Date(user.createdAt);
      const now = new Date();
      return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
    }).length;
    const activeUsers = users.filter(user => user.status === "active").length;
    const growthRate = totalUsers > 0 ? (newUsersThisMonth / totalUsers) * 100 : 0;

    res.json({
      topCountries,
      moderatorsByRole,
      totalUsers,
      newUsersThisMonth,
      activeUsers,
      growthRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Finance Reports
export const getFinanceReports = async (req, res) => {
  try {
    const [manualTransactions, bookings, inventoryItems] = await Promise.all([
      SimpleFinance.find({ source: "manual" }),
      Booking.find({ status: "confirmed" }),
      Inventory.find({ type: "RECEIVE" })
    ]);

    // Combine all transactions
    const allTransactions = [
      ...manualTransactions,
      ...bookings.map(booking => ({
        type: "income",
        amount: booking.grandTotal || 0,
        category: "Booking",
        product: "Tour Package",
        orders: 1
      })),
      ...inventoryItems.map(item => ({
        type: "expense",
        amount: (item.unitCost || 0) * (item.quantity || 0),
        category: "Inventory",
        product: item.name,
        orders: 1
      }))
    ];

    // Group by product/category
    const productStats = {};
    allTransactions.forEach(transaction => {
      const key = transaction.product || transaction.category || "Unknown";
      if (!productStats[key]) {
        productStats[key] = {
          name: key,
          revenue: 0,
          orders: 0,
          category: transaction.category || "General",
          status: "active"
        };
      }
      if (transaction.type === "income") {
        productStats[key].revenue += transaction.amount;
        productStats[key].orders += transaction.orders || 1;
      }
    });

    const topRevenueProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const lowestRevenueProducts = Object.values(productStats)
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 10);

    const totalRevenue = allTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = allTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.json({
      topRevenueProducts,
      lowestRevenueProducts,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Booking Reports
export const getBookingReports = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "confirmed" })
      .populate("items.tourPackage", "name")
      .lean();

    // Group by date
    const dateStats = {};
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt).toISOString().split('T')[0];
      if (!dateStats[date]) {
        dateStats[date] = {
          date,
          bookings: 0,
          revenue: 0,
          passengers: 0,
          status: "confirmed"
        };
      }
      dateStats[date].bookings++;
      dateStats[date].revenue += booking.grandTotal || 0;
      dateStats[date].passengers += booking.items.reduce((sum, item) => sum + (item.qty || 1), 0);
    });

    const allDates = Object.values(dateStats);
    const busiestDates = [...allDates].sort((a, b) => b.bookings - a.bookings).slice(0, 10);
    const quietestDates = [...allDates].sort((a, b) => a.bookings - b.bookings).slice(0, 10);

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.grandTotal || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const conversionRate = 15.0; // Placeholder - would need to calculate from actual data

    res.json({
      busiestDates,
      quietestDates,
      totalBookings,
      totalRevenue,
      avgBookingValue,
      conversionRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};