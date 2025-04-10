const mongoose = require("mongoose");

const manpowerRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labour",
    required: true
  },
  worker_id: {
    type: Number,  // Storing Worker_ID
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  msax_no: {
    type: String,  // Storing MSAX_No
    required: true
  },
  site_location: {
    type: String,
    required: true  // Example: "Site A", "Warehouse", etc.
  },
  shift: {
    type: String,
    enum: ["DAY", "NIGHT"],
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Leave"],
    default: "Present"
  },
  remark: {
    type: String,
    default: ""
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
}, {
  timestamps: true,
  versionKey: false
});

const ManpowerRecord = mongoose.model("ManpowerRecord", manpowerRecordSchema);
module.exports = ManpowerRecord;
