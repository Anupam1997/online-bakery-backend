const mongoose = require("../db")

const orderSchema = new mongoose.Schema({
    username: { type: mongoose.Schema.Types.String, ref: 'Customer', required: true },
    branchId: { type: mongoose.Schema.Types.String, ref: 'Branch', required: true },
    order_state: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered'], default: 'Pending' },
  created_time: { type: Date, default: Date.now },
  last_updated_time: { type: Date },
  product: 
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
  total_amount: { type: Number, required: true },
  order_type: { type: String, enum: ['cake', 'cookie', 'muffin'], required: true },
});

  // Create a mongoose model based on the schema
 const Order = mongoose.model('Order', orderSchema);
 module.exports = Order