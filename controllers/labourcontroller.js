const Labour = require('../models/labour');
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");


// Welcome route
const welcomeToLabour = async (req, res) => {
  try {
    res.status(200).json({ message: "Welcome to labour routes" });
  } catch (error) {
    res.status(500).json({ message: "Welcome route failed", error: error.message });
  }
};


// Create new labour
const createLabour = async (req, res) => {
    try {
        const labour = new Labour(req.body);
        await labour.save();
        res.status(201).json(labour);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all labours
const getAllLabours = async (req, res) => {
    try {
        const labours = await Labour.find();
        res.json(labours);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single labour by ID
const getLabourById = async (req, res) => {
    try {
        const labour = await Labour.findOne({ _id: req.params.id });
        if (!labour) {
            return res.status(404).json({ message: 'Labour not found' });
        }
        res.json(labour);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update labour
const updateLabour = async (req, res) => {
  try {
      const { Status } = req.body;

      // List of statuses that also update Working_Status
      const leaveStatus = ['Inactive', 'Emergency Leave', 'Annual Leave'];

      // If the Status is one of the special leave types, also set Working_Status
      if (leaveStatus.includes(Status)) {
          req.body.Working_Status = Status;
      }

      const labour = await Labour.findOneAndUpdate(
          { _id: req.params.id },
          req.body,
          { new: true, runValidators: true }
      );

      if (!labour) {
          return res.status(404).json({ message: 'Labour not found' });
      }

      res.json(labour);
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
};


// Delete labour
const deleteLabour = async (req, res) => {
    try {
        const labour = await Labour.findOneAndDelete({ _id: req.params.id });
        if (!labour) {
            return res.status(404).json({ message: 'Labour not found' });
        }
        res.json({ message: 'Labour deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const getFilteredLabours = async (req, res) => {
    const {
      page = 1,
      sortBy = 'Worker_ID',
      order = 'asc',
      match = 'partial',
      export: exportType,
      limit: queryLimit = 50,
      ...filters
    } = req.query;
  
    const limit = parseInt(queryLimit) || 50;
    const skip = (page - 1) * limit;
  
    try {
      const query = {};
  
      // Apply filters
      for (let key in filters) {
        if (filters[key]) {
          query[key] =
            match === 'exact'
              ? filters[key]
              : { $regex: new RegExp(filters[key], 'i') };
        }
      }
  
      const sortOrder = order === 'desc' ? -1 : 1;
      const sortOptions = { [sortBy]: sortOrder };
  
      const total = await Labour.countDocuments(query);
      const labours = await Labour.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortOptions)
        .select('-__v');
  
      // ✅ Export as CSV
      if (exportType === 'csv') {
        const fields = [
          'Worker_ID',
          'Name',
          'Trade',
          'Status',
          'Shift',
          'Mobile',
          'Remark',
        ];
        const json2csv = new Parser({ fields });
        const csv = json2csv.parse(labours);
  
        res.header('Content-Type', 'text/csv');
        res.attachment('filtered_labours.csv');
        return res.send(csv);
      }
  
      // ✅ Export as Excel
      if (exportType === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Labours');
  
        worksheet.columns = [
          { header: 'Worker_ID', key: 'Worker_ID', width: 15 },
          { header: 'Name', key: 'Name', width: 25 },
          { header: 'Trade', key: 'Trade', width: 20 },
          { header: 'Status', key: 'Status', width: 10 },
          { header: 'Shift', key: 'Shift', width: 10 },
          { header: 'Mobile', key: 'Mobile', width: 20 },
          { header: 'Remark', key: 'Remark', width: 30 },
        ];
  
        labours.forEach((labour) => {
          worksheet.addRow(labour.toObject());
        });
  
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename=filtered_labours.xlsx');
  
        await workbook.xlsx.write(res);
        return res.end();
      }
  
      // ✅ Normal JSON response
      res.status(200).json({
        totalRecords: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        recordsOnPage: labours.length,
        labours,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching labours', error: error.message });
    }
  };
  


module.exports = {
    welcomeToLabour,
    getFilteredLabours,
    createLabour,
    getAllLabours,
    getLabourById,
    updateLabour,
    deleteLabour,
};
