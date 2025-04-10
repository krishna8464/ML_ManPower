


const {Project} = require("../models/projectmodel");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");


// Welcome route
const welcomeToProject = async (req, res) => {
  try {
    res.status(200).json({ message: "Welcome to project routes" });
  } catch (error) {
    res.status(500).json({ message: "Welcome route failed", error: error.message });
  }
};

// Add a new project
const addProject = async (req, res) => {
  const data = req.body;

  try {
    const newProject = new Project(data);
    await newProject.save();
    res.status(201).json({ message: "Project added successfully", project: newProject });
  } catch (error) {
    res.status(500).json({ message: "Failed to add project", error: error.message });
  }
};

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ project });
  } catch (error) {
    res.status(500).json({ message: "Error fetching project", error: error.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};

// Update project
const updateProject = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updated = await Project.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updated) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ message: "Project updated successfully", project: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};

// Get total project count
const getTotalProjects = async (req, res) => {
    console.log("came here")
    try {
      const total = await Project.countDocuments();
      res.status(200).json({ totalProjects: total });
    } catch (error) {
      res.status(500).json({ message: "Failed to count projects", error: error.message });
    }
  };


    const getFilteredProjects = async (req, res) => {
    
      const {
        page = 1,
        sortBy = "Date_Received",
        order = "asc",
        match = "partial",
        export: exportType,
        limit: queryLimit = 50,
        "Date_Received[from]": dateFrom,
        "Date_Received[to]": dateTo,
        ...filters
      } = req.query;
    
      const limit = parseInt(queryLimit) || 50;
      const skip = (page - 1) * limit;
    
      try {
        const query = {};
    
        // Filter by all fields
        for (let key in filters) {
          if (filters[key]) {
            query[key] =
              match === "exact"
                ? filters[key]
                : { $regex: new RegExp(filters[key], "i") };
          }
        }
    
        // ✅ Date range filter
        if (dateFrom || dateTo) {
          query.Date_Received = {};
          if (dateFrom) query.Date_Received.$gte = new Date(dateFrom);
          if (dateTo) query.Date_Received.$lte = new Date(dateTo);
        }
    
        const sortOrder = order === "desc" ? -1 : 1;
        const sortOptions = { [sortBy]: sortOrder };
    
        const total = await Project.countDocuments(query);
        const projects = await Project.find(query)
          .skip(skip)
          .limit(limit)
          .sort(sortOptions)
          .select("-__v");
    
        // ✅ Export to CSV
        if (exportType === "csv") {
          const fields = [
            "JO",
            "Date_Received",
            "Proj_incharge",
            "Description",
            "Material",
            "P_T_E",
            "MSAX_No",
            "Project_Name",
          ];
          const json2csv = new Parser({ fields });
          const csv = json2csv.parse(projects);
    
          res.header("Content-Type", "text/csv");
          res.attachment("filtered_projects.csv");
          return res.send(csv);
        }
    
        // ✅ Export to Excel
        if (exportType === "excel") {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet("Projects");
    
          worksheet.columns = [
            { header: "JO", key: "JO", width: 20 },
            { header: "Date_Received", key: "Date_Received", width: 20 },
            { header: "Proj_incharge", key: "Proj_incharge", width: 20 },
            { header: "Description", key: "Description", width: 40 },
            { header: "Material", key: "Material", width: 15 },
            { header: "P_T_E", key: "P_T_E", width: 20 },
            { header: "MSAX_No", key: "MSAX_No", width: 20 },
            { header: "Project_Name", key: "Project_Name", width: 30 },
          ];
    
          projects.forEach((project) => {
            worksheet.addRow(project.toObject());
          });
    
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Content-Disposition", "attachment; filename=filtered_projects.xlsx");
    
          await workbook.xlsx.write(res);
          return res.end();
        }
    
        // ✅ Normal JSON response
        res.status(200).json({
          totalRecords: total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          recordsOnPage: projects.length,
          projects,
        });
      } catch (error) {
        res.status(500).json({ message: "Error fetching projects", error: error.message });
      }
    };
  

module.exports = {
  welcomeToProject,
  addProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  updateProject,
  getTotalProjects,
  getFilteredProjects,
};
