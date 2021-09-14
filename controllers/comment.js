const Article = require("../models/article");
const User = require("../models/user");
const Comment = require("../models/comment");
const ObjectId = require("mongoose").Types.ObjectId;

exports.getComments = async (req, res, next) => {
  const articleId = req.params.articleId;
  const currentPage = req.query.page || 1;
  const perPage = 5;
  let totalItems;

  try {
    const totalItems = await Comment.find({ article: ObjectId(articleId) })
        .countDocuments();

    const comments = await Comment.find({ article: ObjectId(articleId) })
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

    res.status(200).json({
        message: "Fetched comments successfully.",
        comments: comments,
        totalItems: totalItems,
      });
  } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
  }
};

exports.createComment = async (req, res, next) => {
  const articleId = req.params.articleId;
  const comment = req.body.comment;
  const comments = new Comment({
    comment: comment,
    article: articleId,
    creator: req.userId,
  });

  try {
    await comments.save();

    const user = await User.findById(req.userId);
    user.comments.push(comments);
    await user.save();

    const article = await Article.findById(articleId);
    article.comments.push(comments);
    await article.save();

    res.status(201).json({
      message: "Comment created successfully!",
      comment: comments,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next();    
  }
};

exports.deleteComment = async (req, res, next) => {
  const commentId = req.params.commentId;
  const articleId = req.params.articleId;

  try {
    const comment = await Comment.findById(commentId);
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
    await Comment.findByIdAndRemove(commentId);

    const user = await User.findById(req.userId);
    user.comments.pull(commentId);
    await user.save();

    const article = await Article.findById(articleId);
    article.comments.pull(commentId);
    await article.save();

    res.status(200).json({ message: "Deleted comment." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
