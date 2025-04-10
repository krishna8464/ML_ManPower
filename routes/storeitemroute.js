const express = require('express');
const storeitemrouter = express.Router();
const { authMiddleware } = require("../middleware/auth");
const {
  welcomeToStore,
  createStoreItem,
  getAllStoreItems,
  getStoreItemById,
  updateStoreItem,
  deleteStoreItem,
  getFilteredStoreItems,
} = require('../controllers/storeitemcontroller');

storeitemrouter.get('/', welcomeToStore);


// ✅ Create a new store item
storeitemrouter.post('/add', authMiddleware, createStoreItem);

// ✅ Get all store items
storeitemrouter.get('/all',authMiddleware, getAllStoreItems);

// ✅ Get filtered store items with pagination, sorting, and export options
storeitemrouter.get('/filter',authMiddleware, getFilteredStoreItems);

// ✅ Get a store item by ID
storeitemrouter.get('/:id',authMiddleware, getStoreItemById);

// ✅ Update a store item by ID
storeitemrouter.patch('/:id',authMiddleware, updateStoreItem);

// ✅ Delete a store item by ID
storeitemrouter.delete('/:id',authMiddleware, deleteStoreItem);

module.exports = { storeitemrouter };
