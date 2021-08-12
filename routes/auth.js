const express = require("express");

const validator = require("../middleware/validators/userValidator");
const authController = require("../controllers/auth");

const router = express.Router();

router.post("/signup", validator.createUserValidation, authController.signup);

router.get("/login", validator.loginValidation, authController.login);

module.exports = router;
