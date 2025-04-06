const express = require("express");
const { welcometoadmin, login, logout, register } = require("../controllers/admincontroller");
const { authMiddleware } = require("../middleware/auth");

const Adminrouter = express.Router();

Adminrouter.get("/",welcometoadmin)
Adminrouter.post("/login", login);
Adminrouter.post("/logout", authMiddleware, logout);
Adminrouter.post("/register", register); // You can add authMiddleware here to allow only super admins

module.exports = {Adminrouter};
