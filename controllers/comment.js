const Article = require("../models/article");
const User = require("../models/user");
const Comment = require("../models/comment");
const ObjectId = require("mongoose").Types.ObjectId;

exports.getComments = (req, res, next) => {
  const articleId = req.params.articleId;
  const currentPage = req.query.page || 1;
  const perPage = 5;
  let totalItems;
  Comment.find({ article: ObjectId(articleId) })
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Comment.find({ article: ObjectId(articleId) })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((comments) => {
      res.status(200).json({
        message: "Fetched comments successfully.",
        comments: comments,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createComment = (req, res, next) => {
  const articleId = req.params.articleId;
  const comment = req.body.comment;
  let creator;
  const comments = new Comment({
    comment: comment,
    article: articleId,
    creator: req.userId,
  });
  comments
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.comments.push(comments);
      return user.save();
    })
    .then((result) => {
      return Article.findById(articleId);
    })
    .then((article) => {
      article.comments.push(comments);
      return article.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Comment created successfully!",
        comment: comments,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next();
    });
};

exports.deleteComment = (req, res, next) => {
  const commentId = req.params.commentId;
  const articleId = req.params.articleId;
  Comment.findById(commentId)
    .then((comment) => {
      if (!comment) {
        const error = new Error("Could not find comment.");
        error.statusCode = 404;
        throw error;
      }
      if (comment.creator.toString() !== req.userId) {
        const error = new Error("Not authorized!");
        error.statusCode = 403;
        throw error;
      }
      return Comment.findByIdAndRemove(commentId);
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.comments.pull(commentId);
      return user.save();
    })
    .then((result) => {
      return Article.findById(articleId);
    })
    .then((article) => {
      article.comments.pull(commentId);
      return article.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Deleted comment." });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
