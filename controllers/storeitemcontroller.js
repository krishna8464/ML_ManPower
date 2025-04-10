const StoreItem = require("../models/storeitem");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");


// Welcome route
const welcomeToStore = async (req, res) => {
  try {
    res.status(200).json({ message: "Welcome to Store routes" });
  } catch (error) {
    res.status(500).json({ message: "Welcome route failed", error: error.message });
  }
};


// Create a new store item
const createStoreItem = async (req, res) => {
  try {
    const item = new StoreItem(req.body);
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(500).json({ message: "Error creating store item", error: err.message });
  }
};

// Get all store items
const getAllStoreItems = async (req, res) => {
  try {
    const items = await StoreItem.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching store items", error: err.message });
  }
};

// Get a single item by its ID
const getStoreItemById = async (req, res) => {
  try {
    const item = await StoreItem.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: "Error fetching item", error: err.message });
  }
};

// Update an item by ID
const updateStoreItem = async (req, res) => {
  try {
    const updatedItem = await StoreItem.findOneAndUpdate({ id: req.params.id }, req.body, {
      new: true,
    });
    if (!updatedItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: "Error updating item", error: err.message });
  }
};

// Delete an item by ID
const deleteStoreItem = async (req, res) => {
  try {
    const deletedItem = await StoreItem.findOneAndDelete({ id: req.params.id });
    if (!deletedItem) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting item", error: err.message });
  }
};

const getFilteredStoreItems = async (req, res) => {
    const {
      page = 1,
      sortBy = "name",
      order = "asc",
      match = "partial",
      export: exportType,
      limit: queryLimit = 50,
      ...filters
    } = req.query;
  
    const limit = parseInt(queryLimit) || 50;
    const skip = (page - 1) * limit;
  
    try {
      const query = {};
  
      // Build filter query based on 'match' type
      for (let key in filters) {
        if (filters[key]) {
          query[key] =
            match === "exact"
              ? filters[key]
              : { $regex: new RegExp(filters[key], "i") };
        }
      }
  
      const sortOrder = order === "desc" ? -1 : 1;
      const sortOptions = { [sortBy]: sortOrder };
  
      const total = await StoreItem.countDocuments(query);
      const items = await StoreItem.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortOptions)
        .select("-__v");
  
      // ✅ Export to CSV
      if (exportType === "csv") {
        const fields = ["id", "name", "unit"];
        const json2csv = new Parser({ fields });
        const csv = json2csv.parse(items);
  
        res.header("Content-Type", "text/csv");
        res.attachment("filtered_store_items.csv");
        return res.send(csv);
      }
  
      // ✅ Export to Excel
      if (exportType === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Store Items");
  
        worksheet.columns = [
          { header: "ID", key: "id", width: 20 },
          { header: "Name", key: "name", width: 50 },
          { header: "Unit", key: "unit", width: 10 },
        ];
  
        items.forEach((item) => {
          worksheet.addRow(item.toObject());
        });
  
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=filtered_store_items.xlsx");
  
        await workbook.xlsx.write(res);
        return res.end();
      }
  
      // ✅ JSON response
      res.status(200).json({
        totalRecords: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        recordsOnPage: items.length,
        items,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching store items", error: error.message });
    }
  };

module.exports = {
  welcomeToStore,
  createStoreItem,
  getAllStoreItems,
  getStoreItemById,
  updateStoreItem,
  deleteStoreItem,
  getFilteredStoreItems,
};
