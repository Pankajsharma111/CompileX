const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const paperSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  image: String,
  subject: String,
  branch: String,
  semester: Number,
  year: Number,
  examType: String,
  createdAt: { type: Date, default: Date.now },
});

const Paper = mongoose.model("Paper", paperSchema);

module.exports = Paper;
