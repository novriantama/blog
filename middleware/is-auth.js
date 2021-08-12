const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const auth = req.get("Authorization");
  if (!auth) {
    const error = new Error("Not logged in.");
    error.statusCode = 401;
    throw error;
  }
  const token = auth.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, "passwordrahasia");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decoded) {
    const error = new Error("Not authenticated");
    error.statusCode = "401";
    throw error;
  }
  req.userId = decoded.userId;
  next();
};
