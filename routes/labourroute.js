const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  welcomeToLabour,
  createLabour,
  getAllLabours,
  getLabourById,
  updateLabour,
  deleteLabour,
  getFilteredLabours,
} = require("../controllers/labourcontroller");

const Labourrouter = express.Router();

// Public route
Labourrouter.get("/", welcomeToLabour);

// Protected routes
Labourrouter.get("/filter", authMiddleware, getFilteredLabours);
Labourrouter.post("/add", authMiddleware, createLabour);
Labourrouter.get("/all", authMiddleware, getAllLabours);
Labourrouter.get("/:id", authMiddleware, getLabourById);
Labourrouter.patch("/:id", authMiddleware, updateLabour);
Labourrouter.delete("/:id", authMiddleware, deleteLabour);

module.exports = { Labourrouter };
