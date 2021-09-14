const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = async (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(password, salt);

    const user = new User({
      email: email,
      password: hashedPw,
      name: name,
    });
    await user.save();

    res.status(201).json({ message: "User created!", userId: user._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);    
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let userData;

  try {
    const user = await User.findOne({email: email});
    if (!user) {
      const error = new Error("Email not found");
      error.statusCode = 401;
      throw error;
    }
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      const error = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: userData.email,
        userId: userData._id.toString(),
      },
      "passwordrahasia",
      { expiresIn: "7d" }
    );
    res.status(200).json({ token: token, userId: userData._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
