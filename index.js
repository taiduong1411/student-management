const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const database = require("./src/database/database");
dotenv.config();
database.connect();
const PORT = process.env.PORT || 3000;

// CORS Config
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

const accountRoutes = require("./src/route/account.route");
const adminRoutes = require("./src/route/admin.route");
const studentRoutes = require("./src/route/student.route");

// Express Config
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  })
);

app.use("/api/accounts", accountRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
