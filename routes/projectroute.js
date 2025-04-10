const express = require("express");
const { body, validationResult } = require("express-validator");
const { authMiddleware } = require("../middleware/auth");
const {
  welcomeToProject,
  addProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  updateProject,
  getTotalProjects,
  getFilteredProjects
} = require("../controllers/projectcontroller");

const Projectrouter = express.Router();

Projectrouter.get("/", welcomeToProject);
Projectrouter.get("/filter",authMiddleware,getFilteredProjects);
Projectrouter.post("/add",authMiddleware,addProject);
Projectrouter.get("/all",authMiddleware, getAllProjects);
Projectrouter.get("/getcount",authMiddleware,getTotalProjects);
Projectrouter.get("/:id",authMiddleware, getProjectById);
Projectrouter.delete("/:id",authMiddleware, deleteProject);
Projectrouter.patch("/:id",authMiddleware, updateProject);



module.exports = {Projectrouter};
