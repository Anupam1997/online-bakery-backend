const mongoose = require("../db")
const productSchema = new mongoose.Schema({
    item_id: String,
    category: String,
    name: String,
    price: Number,
    star_rating: Number,
    num_reviews: Number,
    description: String,
    image_url: String,
    calorific_value: Number,
    eggless: Boolean,
    vegan: Boolean,
    gluten_free: Boolean,
  });
  
  // Create a mongoose model based on the schema
   const Product = mongoose.model('Product', productSchema);
   module.exports = Product
  