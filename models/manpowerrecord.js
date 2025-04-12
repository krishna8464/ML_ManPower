const mongoose = require("mongoose");

const manpowerRecordSchema = new mongoose.Schema({
  date: {
    type: String, // Format: "YYYY-MM-DD"
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labour",
    required: true
  },
  worker_id: {
    type: Number, // Storing Worker_ID
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: false
  },
  msax_no: {
    type: String, // Storing MSAX_No
    required: true
  },
  site_location: {
    type: String,
    required: true // Example: "Site A", "Workshop", "Leave"
  },
  shift: {
    type: String,
    enum: ["DAY", "NIGHT"],
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Emergency Leave", "Annual Leave", "Sick Leave",],
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

// ✅ Add compound index to ensure only one record per worker per date
manpowerRecordSchema.index({ worker: 1, date: 1 }, { unique: true });

const ManpowerRecord = mongoose.model("ManpowerRecord", manpowerRecordSchema);
module.exports = ManpowerRecord;
