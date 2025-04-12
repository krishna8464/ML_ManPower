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
    const records = req.body.records; // Expecting array of manpower records
    const adminId = req.user.id;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "No manpower records provided" });
    }

    const leaveStatuses = ["Sick Leave", "Emergency Leave", "Annual Leave", "Absent"];
    const toInsert = [];
    const skipped = [];

    for (const record of records) {
      const { worker, project, date, shift, site_location, status, remark } = record;

      const labourDoc = await Labour.findById(worker);
      if (!labourDoc || labourDoc.Status !== "Active") {
        skipped.push({ worker, reason: "Labour not found or not active" });
        continue;
      }

      let manpowerData = {
        date,
        worker: labourDoc._id,
        worker_id: labourDoc.Worker_ID,
        shift: labourDoc.Shift || shift || "DAY",
        msax_no: "N/A",
        status,
        assigned_by: adminId,
      };

      if (leaveStatuses.includes(status)) {
        // Leave record
        manpowerData.project = null;
        manpowerData.site_location = null;
        manpowerData.remark = remark || "Marked as Leave manually";
      } else if (project === "MLOVERHEAD") {
        // Company work record
        manpowerData.project = null;
        manpowerData.msax_no = "MLOVERHEAD";
        manpowerData.site_location = site_location || "Company Work";
        manpowerData.remark = remark || "Company Overhead Work";
      } else {
        // Normal present record
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
          skipped.push({ worker, reason: "Project not found" });
          continue;
        }

        manpowerData.project = projectDoc._id;
        manpowerData.msax_no = projectDoc.MSAX_No || "N/A";
        manpowerData.site_location = site_location;
        manpowerData.remark = remark || "";
      }

      // Push record to insert array
      toInsert.push(manpowerData);

      // 🔄 Update Labour.Working_Status
      await Labour.findByIdAndUpdate(
        labourDoc._id,
        { Working_Status: status },
        { new: true }
      );
    }

    // Insert all manpower records
    const inserted = await Manpower.insertMany(toInsert, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.warn("Duplicate record error in bulk insert");
      }
    });

    res.status(201).json({
      message: "Bulk manpower creation complete",
      insertedCount: toInsert.length,
      skipped,
    });

  } catch (error) {
    console.error("Error in bulk creation:", error);
    res.status(500).json({ message: "Bulk manpower creation failed", error: error.message });
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

    if (!date) return res.status(400).json({ message: "Date is required" });

    date = new Date(date).toISOString().split("T")[0];

    const manpowerQuery = { date };
    if (shift) manpowerQuery.shift = shift;

    // 🔍 Get already marked workers
    const initialMarkedRecords = await Manpower.find(manpowerQuery).select("worker status site_location shift");
    const markedWorkerIds = initialMarkedRecords.map(r => r.worker.toString());

    // ✅ Auto-mark Emergency Leave & Annual Leave labours
    const leaveTypes = ["Emergency Leave", "Annual Leave"];
    const autoLeaveLabours = await Labour.find({
      Status: { $in: leaveTypes },
      _id: { $nin: markedWorkerIds }
    });

    const autoLeaveRecords = autoLeaveLabours.map(labour => ({
      date,
      worker: labour._id,
      worker_id: labour.Worker_ID,
      msax_no: labour.MSAX_No || "N/A",
      shift: labour.Shift || shift || "DAY",
      project: labour.Project && mongoose.Types.ObjectId.isValid(labour.Project)
        ? labour.Project
        : null,
      site_location: "Leave",
      status: labour.Status, // "Emergency Leave" or "Annual Leave"
      remark: `${labour.Status} (auto-marked)`,
      assigned_by: req.user?._id || null,
    }));

    if (autoLeaveRecords.length > 0) {
      await Manpower.insertMany(autoLeaveRecords);
    }

    // 🔄 Refresh Manpower records for stats after auto-inserts
    const updatedMarkedRecords = await Manpower.find(manpowerQuery).select("worker status site_location shift");
    const updatedMarkedIds = updatedMarkedRecords.map(r => r.worker.toString());

    // 🔍 Find labours still not marked
    const pendingQuery = {
      Status: { $nin: leaveTypes },
      _id: { $nin: updatedMarkedIds },
    };
    if (shift) pendingQuery.Shift = shift;

    if (search) {
      pendingQuery.$or = [
        { Name: { $regex: search, $options: "i" } }
      ];
      if (!isNaN(Number(search))) {
        pendingQuery.$or.push({ Worker_ID: Number(search) });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPending = await Labour.countDocuments(pendingQuery);
    const labours = await Labour.find(pendingQuery).skip(skip).limit(parseInt(limit));

    // ✅ Calculate stats
    const totalPresent = updatedMarkedRecords.filter(r => r.status === "Present").length;
    const totalLeave = updatedMarkedRecords.filter(r => ["Absent", "Sick Leave"].includes(r.status)).length;
    const totalAnnualLeave = updatedMarkedRecords.filter(r => r.status === "Annual Leave").length;
    const totalEmergencyLeave = updatedMarkedRecords.filter(r => r.status === "Emergency Leave").length;

    const siteCount = updatedMarkedRecords.filter(r =>
      r.status === "Present" && r.site_location?.toLowerCase() !== "workshop"
    ).length;

    const workshopCount = updatedMarkedRecords.filter(r =>
      r.status === "Present" && r.site_location?.toLowerCase() === "workshop"
    ).length;

    const dayPresentCount = updatedMarkedRecords.filter(r => r.status === "Present" && r.shift === "DAY").length;
    const nightPresentCount = updatedMarkedRecords.filter(r => r.status === "Present" && r.shift === "NIGHT").length;

    res.json({
      totalPending,
      totalPresent,
      totalLeave,
      totalAnnualLeave,
      totalEmergencyLeave,
      siteCount,
      workshopCount,
      dayPresentCount,
      nightPresentCount,
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
