
const mongoose = require("../db")
const customerSchema = new mongoose.Schema({
    userName: String,
    customerName: String,
    password:String,
});


// Create a mongoose model based on the schema
 const Customer = mongoose.model('Customer', customerSchema);
 module.exports = Customer
