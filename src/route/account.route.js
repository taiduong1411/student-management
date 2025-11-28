const express = require("express");
const { register, login, logout } = require("../controller/account.controller");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

module.exports = router;
