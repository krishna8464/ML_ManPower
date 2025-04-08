const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  JO: { type: String, required: true },
  Date_Received: { type: String, required: true }, // or use type: Date if you plan to convert and store actual Date objects
  Proj_incharge: { type: String, required: true },
  Description: { type: String },
  Material: { type: String },
  P_T_E: { type: String },
  MSAX_No: { type: String },
  Project_Name: { type: String } // "Project Name" converted to camelCase
},{
    versionKey: false
});

const Project = mongoose.model("Project", projectSchema);
module.exports = { Project };
