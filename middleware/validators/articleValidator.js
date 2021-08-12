const { check, validationResult } = require("express-validator");

exports.articleValidation = [
  check("title").trim().isLength({ min: 4 }),
  check("content").trim().isLength({ min: 4 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });
    next();
  },
];
