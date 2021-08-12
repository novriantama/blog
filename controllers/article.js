const fs = require("fs");
const path = require("path");

const Article = require("../models/article");
const User = require("../models/user");

exports.getArticles = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 5;
  let totalItems;
  Article.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Article.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((articles) => {
      res.status(200).json({
        message: "Fetched articles successfully.",
        posts: articles,
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

exports.createArticle = (req, res, next) => {
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const article = new Article({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  article
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(article);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Article created successfully!",
        article: article,
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

exports.getArticle = (req, res, next) => {
  const articleId = req.params.articleId;
  Article.findById(articleId)
    .then((article) => {
      if (!article) {
        const error = new Error("Could not find article.");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Article fetched.", article: article });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateArticle = (req, res, next) => {
  const articleId = req.params.articleId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No image picked.");
    error.statusCode = 422;
    throw error;
  }
  Article.findById(articleId)
    .then((article) => {
      if (!article) {
        const error = new Error("Could not find article.");
        error.statusCode = 404;
        throw error;
      }
      if (article.creator.toString() !== req.userId) {
        const error = new Error("Not authorized!");
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== article.imageUrl) {
        clearImage(article.imageUrl);
      }
      article.title = title;
      article.imageUrl = imageUrl;
      article.content = content;
      return article.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Article updated!", article: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteArticle = (req, res, next) => {
  const articleId = req.params.articleId;
  Article.findById(articleId)
    .then((article) => {
      if (!article) {
        const error = new Error("Could not find article.");
        error.statusCode = 404;
        throw error;
      }
      if (article.creator.toString() !== req.userId) {
        const error = new Error("Not authorized!");
        error.statusCode = 403;
        throw error;
      }
      clearImage(article.imageUrl);
      return Article.findByIdAndRemove(articleId);
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(articleId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Deleted article." });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
