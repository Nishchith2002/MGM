// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { loginToSkySpark } = require("../controllers/authController");

router.post("/login", loginToSkySpark);

module.exports = router;
