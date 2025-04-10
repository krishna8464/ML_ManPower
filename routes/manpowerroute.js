const express = require("express");
const {
  welcomeToManpower,
  createManpower,
  getAllManpower,
  getManpowerById,
  updateManpower,
  deleteManpower,
  getFilteredManpower,
} = require("../controllers/manpowercontroller");

const { authMiddleware } = require("../middleware/auth");

const Manpowerrouter = express.Router();

Manpowerrouter.get("/", welcomeToManpower);
Manpowerrouter.post("/add", authMiddleware, createManpower);
Manpowerrouter.get("/all", authMiddleware, getAllManpower);
Manpowerrouter.get("/filter", authMiddleware, getFilteredManpower);
Manpowerrouter.get("/:id", authMiddleware, getManpowerById);
Manpowerrouter.patch("/:id", authMiddleware, updateManpower);
Manpowerrouter.delete("/:id", authMiddleware, deleteManpower);

module.exports = { Manpowerrouter };
