const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/admin");
const { Tocken } = require("../models/tokenmodel");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "ML_ManPower";


const welcometoadmin = async(req, res)=>{
    try {
        res.status(200).json({message:"welome to admin routes"});
    } catch (error) {
        res.status(500).json({ message: "Welcome route not working", error: err.message });
    }
}


// Admin Login
const login = async (req, res) => {
    const { contact, password } = req.body;
    try {
      // Find admin
      const admin = await Admin.findOne({ contact });
      if (!admin) return res.status(404).json({ message: "Admin not found" });
  
      // Validate password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
  
      // Invalidate any previous active tokens for this admin
      await Tocken.updateMany(
        { admin_id: admin._id, is_active: true },
        { $set: { is_active: false } }
      );
  
      // Generate new token
      const token = jwt.sign({ userid: admin._id, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
  
      // Save new token to DB
      await Tocken.create({ token, is_active: true, admin_id: admin._id });
  
      res.status(200).json({ token, admin });
    } catch (err) {
      res.status(500).json({ message: "Login failed", error: err.message });
    }
  };
  
  

// Admin Logout
const logout = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(400).json({ message: "Token missing" });
  
    const token = authHeader.split(" ")[1];
  
    try {
      const tokenDoc = await Tocken.findOne({ token, is_active: true });
      if (!tokenDoc) {
        return res.status(404).json({ message: "Token not found or already inactive" });
      }
  
      tokenDoc.is_active = false;
      await tokenDoc.save();
  
      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      res.status(500).json({ message: "Logout failed", error: err.message });
    }
  };
  

// Register a new admin
const register = async (req, res) => {
  const { name, designation, contact, password, access_level } = req.body;
//   console.log(req.body)
  try {
    const exists = await Admin.findOne({ contact });
    if (exists) return res.status(400).json({ message: "Admin already exists" });

    const newAdmin = new Admin({ name, designation, contact, password, access_level });
    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully", admin: newAdmin });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

module.exports = { welcometoadmin, login, logout, register };
