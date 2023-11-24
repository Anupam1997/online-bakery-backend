// db.js

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/star_bakery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose;