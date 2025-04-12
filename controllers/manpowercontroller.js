const Manpower = require('../models/manpowerrecord'); // Adjust the path if needed
const Labour = require('../models/labour');
const {Project} = require("../models/projectmodel");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");

// Welcome route
const welcomeToManpower = async (req, res) => {
  try {
    res.status(200).json({ message: "Welcome to manpower routes" });
  } catch (error) {
    res.status(500).json({ message: "Welcome route failed", error: error.message });
  }
};

// Create manpower record
const createManpower = async (req, res) => {
  try {
    const { worker, project, date, shift, site_location, status, remark } = req.body;
    const adminId = req.user.id;

    // 1. Fetch Labour
    const labourDoc = await Labour.findById(worker);
    if (!labourDoc) {
      return res.status(404).json({ message: "Labour not found" });
    }

    // ❌ Reject if labour is not active
    if (labourDoc.Status !== "Active") {
      return res.status(400).json({ message: "Cannot assign manpower to inactive labour" });
    }

    // Define leave-type statuses
    const leaveStatuses = ["Sick Leave", "Emergency Leave", "Annual Leave", "Absent"];

    let manpowerData = {
      date,
      worker: labourDoc._id,
      worker_id: labourDoc.Worker_ID,
      shift: labourDoc.Shift || shift || "DAY",
      msax_no: "N/A", // default
      status,
      assigned_by: adminId
    };

    if (leaveStatuses.includes(status)) {
      // Leave entry logic
      manpowerData.project = null;
      manpowerData.site_location = null;
      manpowerData.remark = remark || "Marked as Leave manually";
    } else {
      // Normal entry logic
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({ message: "Project not found" });
      }

      manpowerData.project = projectDoc._id;
      manpowerData.msax_no = projectDoc.MSAX_No || "N/A";
      manpowerData.site_location = site_location;
      manpowerData.remark = remark || "";
    }

    const record = await Manpower.create(manpowerData);

    res.status(201).json({
      message: "Manpower record created successfully",
      data: record
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Manpower record for this labour already exists for the selected date." });
    }
    console.error("Error in createManpower:", error);
    res.status(400).json({ message: "Failed to create record", error: error.message });
  }
};

  

// Get all manpower records
const getAllManpower = async (req, res) => {
    try {
      const records = await Manpower.find()
        .populate('worker', 'Name Worker_ID Description')
        .populate('project', 'Project_Name JO')
        .populate('assigned_by', 'name');
      res.status(200).json(records);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

// Get manpower by ID
const getManpowerById = async (req, res) => {
  try {
    const record = await Manpower.findById(req.params.id)
      .populate('worker', 'Name Worker_ID')
      .populate('project', 'Project_Name JO')
      .populate('assigned_by', 'name');
    if (!record) return res.status(404).json({ message: "Manpower record not found" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update manpower record
const updateManpower = async (req, res) => {
  try {
    const record = await Manpower.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ message: "Manpower record not found" });
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete manpower record
const deleteManpower = async (req, res) => {
  try {
    const record = await Manpower.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Filter manpower records
const getFilteredManpower = async (req, res) => {
  const {
    page = 1,
    limit: queryLimit = 50,
    sortBy = 'date',
    order = 'desc',
    match = 'partial',
    export: exportType,
    ...filters
  } = req.query;

  const limit = parseInt(queryLimit);
  const skip = (page - 1) * limit;

  try {
    const query = {};

    // Filter logic
    if (filters.worker_name) {
      query['worker_id.Name'] = match === 'exact'
        ? filters.worker_name
        : { $regex: new RegExp(filters.worker_name, 'i') };
    }

    if (filters.project_name) {
      query['project_id.Project_Name'] = match === 'exact'
        ? filters.project_name
        : { $regex: new RegExp(filters.project_name, 'i') };
    }

    if (filters.date_from && filters.date_to) {
      query.date = {
        $gte: new Date(filters.date_from),
        $lte: new Date(filters.date_to)
      };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const total = await Manpower.countDocuments(query);

    const records = await Manpower.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions)
      .populate('worker_id', 'Name Worker_ID')
      .populate('project_id', 'Project_Name JO')
      .populate('admin_id', 'name');

    // CSV export
    if (exportType === 'csv') {
      const fields = ['worker_id.Name', 'project_id.Project_Name', 'date', 'status', 'remark'];
      const parser = new Parser({ fields });
      const csv = parser.parse(records);
      res.header('Content-Type', 'text/csv');
      res.attachment('filtered_manpower.csv');
      return res.send(csv);
    }

    // Excel export
    if (exportType === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Manpower');

      worksheet.columns = [
        { header: 'Worker Name', key: 'worker', width: 25 },
        { header: 'Project Name', key: 'project', width: 25 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Remark', key: 'remark', width: 30 },
      ];

      records.forEach((rec) => {
        worksheet.addRow({
          worker: rec.worker_id?.Name,
          project: rec.project_id?.Project_Name,
          date: rec.date,
          status: rec.status,
          remark: rec.remark
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=manpower.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    }

    // JSON Response
    res.status(200).json({
      totalRecords: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      recordsOnPage: records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching records', error: error.message });
  }
};

const getLaboursPendingAttendance = async (req, res) => {
  try {
    const { shift, search = "", page = 1, limit = 10 } = req.query;
    let { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // ✅ Format date to YYYY-MM-DD
    const dateObj = new Date(date);
    date = dateObj.toISOString().split("T")[0];

    const manpowerQuery = { date };
    if (shift) manpowerQuery.shift = shift;

    // 🔍 First fetch marked IDs only
    const initialMarkedRecords = await Manpower.find(manpowerQuery).select("worker");
    const markedWorkerIds = initialMarkedRecords.map(record => record.worker.toString());

    // 🚫 Find unmarked leave labours
    const leaveLabours = await Labour.find({
      Status: "Leave",
      _id: { $nin: markedWorkerIds }
    });

    const leaveManpowerRecords = [];

    for (const labour of leaveLabours) {
      const existing = await Manpower.findOne({ worker: labour._id, date });
      if (existing) continue;

      leaveManpowerRecords.push({
        date,
        worker: labour._id,
        worker_id: labour.Worker_ID,
        msax_no: labour.MSAX_No || "N/A",
        shift: labour.Shift || shift || "DAY",
        project: labour.Project && mongoose.Types.ObjectId.isValid(labour.Project)
          ? labour.Project
          : null,
        site_location: labour.Site_Location?.toLowerCase() === "workshop" ? "Workshop" : "Leave",
        status: "Leave",
        remark: "Marked as Leave automatically",
        assigned_by: req.user?._id || null,
      });

      markedWorkerIds.push(labour._id.toString());
    }

    // ✅ Insert leave records
    if (leaveManpowerRecords.length > 0) {
      await Manpower.insertMany(leaveManpowerRecords);
    }

    // 🔁 Re-fetch all manpower records for updated stats
    const markedRecords = await Manpower.find(manpowerQuery).select("worker status site_location");

    // 🔍 Pending labours
    const query = {
      Status: { $ne: "Leave" },
      _id: { $nin: markedWorkerIds },
    };
    if (shift) query.Shift = shift;

    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: "i" } }
      ];
      if (!isNaN(Number(search))) {
        query.$or.push({ Worker_ID: Number(search) });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPending = await Labour.countDocuments(query);
    const labours = await Labour.find(query).skip(skip).limit(parseInt(limit));

    // ✅ Attendance stats
    const totalPresent = markedRecords.filter(r => r.status === "Present").length;
    const totalLeave = markedRecords.filter(r => r.status === "Leave").length;

    const siteCount = markedRecords.filter(
      r => r.status === "Present" && r.site_location?.toLowerCase() !== "workshop"
    ).length;

    const workshopCount = markedRecords.filter(
      r => r.status === "Present" && r.site_location?.toLowerCase() === "workshop"
    ).length;

    res.json({
      totalPending,
      totalPresent,
      totalLeave,
      siteCount,
      workshopCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPending / limit),
      labours
    });

  } catch (error) {
    console.error("Error fetching labours:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};







module.exports = {
  welcomeToManpower,
  createManpower,
  getAllManpower,
  getManpowerById,
  updateManpower,
  deleteManpower,
  getFilteredManpower,
  getLaboursPendingAttendance
};
