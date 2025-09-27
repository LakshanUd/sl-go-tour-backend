// routes/userRouter.js
import express from "express";
import bcrypt from "bcrypt";
import {
  loginUser,
  saveUser,
  googleLogin,
  getAllUsers,
} from "../controllers/userController.js";
import verifyJWT from "../middlewares/auth.js";
import User from "../models/UserModel.js";

const router = express.Router();

/* ===== Role enum support (allow all non-Customer roles) ===== */
const ALLOWED_MANAGED_ROLES = [
  "Admin",
  "AC-Manager",
  "Author",
  "CF-Manager",
  "IN-Manager",
  "Chef",
  "TP-Manager",
  "VC-Manager",
];

/* ========= Public / Basic ========= */

// LIST all users (array)
router.get("/", getAllUsers);

// CREATE user (same handler as /register; controller enforces role rules)
router.post("/", saveUser);
router.post("/register", saveUser);

// AUTH
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

/* ========= Self-service profile (place BEFORE any `/:id` routes) ========= */

// Get current user's profile
router.get("/me", verifyJWT, async (req, res) => {
  try {
    const u = await User.findOne({ email: req.user.email }).lean();
    if (!u) return res.status(404).json({ message: "User not found" });
    return res.json(u);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

// Update current user's profile and/or password
router.put("/me", verifyJWT, async (req, res) => {
  try {
    const u = await User.findOne({ email: req.user.email });
    if (!u) return res.status(404).json({ message: "User not found" });

    const {
      firstName,
      lastName,
      nationality,
      mobile,
      gender,
      currentPassword,
      password, // new password (optional)
    } = req.body || {};

    // Change password (requires currentPassword)
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: "currentPassword is required" });
      }
      const ok = bcrypt.compareSync(currentPassword, u.password);
      if (!ok) {
        return res.status(403).json({ message: "Current password incorrect" });
      }
      u.password = bcrypt.hashSync(password, 10);
    }

    // Update editable fields
    if (firstName !== undefined) u.firstName = firstName;
    if (lastName !== undefined) u.lastName = lastName;
    if (nationality !== undefined) u.nationality = nationality;
    if (mobile !== undefined) u.mobile = mobile;
    if (gender !== undefined) u.gender = gender;

    await u.save();

    return res.json({
      user: {
        firstName: u.firstName,
        lastName: u.lastName,
        nationality: u.nationality,
        mobile: u.mobile,
        gender: u.gender,
        email: u.email,
        role: u.role,
      },
    });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

/* ========= Admin-only management ========= */

// Update role (allow any non-Customer enum role)
router.put("/:id/role", verifyJWT, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const { role } = req.body;
    if (!ALLOWED_MANAGED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({
          message:
            "Role must be one of: " + ALLOWED_MANAGED_ROLES.join(", "),
        });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    // Optional: block changing your own role via API (UI already blocks)
    // if (target.email === req.user.email) {
    //   return res.status(400).json({ message: "You cannot change your own role" });
    // }

    target.role = role;
    await target.save();

    return res.status(200).json({ message: "Role updated", user: target });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

// Delete user (cannot delete own account)
router.delete("/:id", verifyJWT, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.email === req.user.email) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "User deleted" });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

export default router;
