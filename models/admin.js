const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String },
  contact: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  access_level: { type: String, default: "admin" },
}, { timestamps: true },{versionKey: false});

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
