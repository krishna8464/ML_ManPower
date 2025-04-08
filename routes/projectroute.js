const express = require("express");
const { body, validationResult } = require("express-validator");
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
Projectrouter.get("/filter",getFilteredProjects);
Projectrouter.post("/add",addProject);
Projectrouter.get("/all", getAllProjects);
Projectrouter.get("/getcount",getTotalProjects);
Projectrouter.get("/:id", getProjectById);
Projectrouter.delete("/:id", deleteProject);
Projectrouter.put("/:id", updateProject);



module.exports = {Projectrouter};
