const mongoose = require("../db");
const branchSchema = new mongoose.Schema({
  branchId: String,
  name: String,
  city: String,
  noOfOrders: Number,
  contact: String,
  address: String,
});

// Create a mongoose model based on the schema
const Branch = mongoose.model("Branch", branchSchema);
module.exports = Branch;
