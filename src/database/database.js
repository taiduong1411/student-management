const mongoose = require("mongoose");
require("dotenv").config();
const uri_compass = process.env.MONGODB_URI;
async function connect() {
  try {
    await mongoose.set("strictQuery", true);
    await mongoose.connect(uri_compass);
    console.log("connect db success");
  } catch (error) {
    console.log("error");
  }
}
module.exports = { connect };
