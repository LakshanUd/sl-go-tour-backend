// controllers/userController.js
import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export function saveUser(req, res) {

    if(req.body.role != "Customer"){
        if(req.user == null){
            return res.status(403).json({ message: "You need to login as an admin" });
        }
        if(req.user.role != "Admin"){
            return res.status(403).json({ message: "Unauthorized action" });
        }
    }
    
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        nationality: req.body.nationality,
        email: req.body.email,
        mobile: req.body.mobile,
        gender: req.body.gender,
        password: hashedPassword,
        role: req.body.role,
    });



    user.save()
        .then(() => {
            res.status(201).json({ message: "User registered successfully" });
        })
        .catch((error) => {
            res.status(500).json({ error: "Error registering user" });
        });
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find().lean();
    // Return a plain array (frontend expects an array)
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
}

export function loginUser(req, res) {

    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ 
        email: email 
    })
    .then((user) => {
        if(user == null) {
            res.status(401).json({ 
                message: "Invalid email",
                error: "Invalid email" });
        }else {
            const isPasswordValid = bcrypt.compareSync(password, user.password);
            if(isPasswordValid) {

                const userData = {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    mobile: user.mobile,
                }

                const token = jwt.sign(userData, process.env.JWT_SECRET);

                res.status(200).json({ 
                    message: "Login successful", 
                    token: token,
                    user: userData
                });


                
            }else {
                res.status(403).json({ 
                    message: "Invalid password",
                    error: "Invalid password"
                  });
            }
        }
    })

}

export async function googleLogin(req, res) {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ message: "Missing access_token" });
    }

    // 1) Get user profile from Google using the access token
    //    (No need for client secret for this endpoint)
    const { data: gUser } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    // gUser: { sub, email, email_verified, name, given_name, family_name, picture, ... }

    if (!gUser?.email) {
      return res.status(401).json({ message: "Google user has no email" });
    }

    // 2) Find or create a local user
    let user = await User.findOne({ email: gUser.email });

    if (!user) {
      user = new User({
        firstName: gUser.given_name || "Google",
        lastName: gUser.family_name || "User",
        nationality: "Unknown",
        email: gUser.email.toLowerCase(),
        mobile: "N/A",
        gender: "Other",
        password: bcrypt.hashSync(
          // random placeholder password (not used for Google logins)
          `GOOGLE_${gUser.sub}_${Date.now()}`,
          10
        ),
        role: "Customer", // default role
      });
      await user.save();
    }

    // 3) Mint your own JWT
    const userData = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      mobile: user.mobile,
    };
    const token = jwt.sign(userData, process.env.JWT_SECRET);

    return res.status(200).json({
      message: "Google login successful",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("[googleLogin] error:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Google login failed" });
  }
}