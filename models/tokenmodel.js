const mongoose = require("mongoose");

const tockenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now, expires: '7d' }
},{
  versionKey: false
});

const Tocken = mongoose.model("Tocken", tockenSchema);
module.exports = { Tocken };
