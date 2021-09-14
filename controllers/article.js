const fs = require("fs");
const path = require("path");

const Article = require("../models/article");
const User = require("../models/user");

exports.getArticles = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 5;
  try {
    const totalItems = await Article.find()
      .countDocuments();
    const articles = await Article.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: "Fetched articles successfully.",
      posts: articles,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createArticle = async (req, res, next) => {
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  const article = new Article({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    await article.save();

    const user = await User.findById(req.userId);
    user.posts.push(article);
    await user.save();

    res.status(201).json({
      message: "Article created successfully!",
      article: article,
      creator: { _id: user._id, name: user.name },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next();
  }
}

exports.getArticle = async (req, res, next) => {
  const articleId = req.params.articleId;
  try {
    const article = await Article.findById(articleId);
    if (!article) {
      const error = new Error("Could not find article.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Article fetched.", article: article });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err); 
  }
};

exports.updateArticle = async (req, res, next) => {
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

  try {
    const article = await Article.findById(articleId);
    if (!article) {
      const error = new Error("Could not find article.");
      error.statusCode = 403;
      throw error;
    }
    if (article.creator.toString() !== req.userId) {
      const error = new Error("Not authorized.");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== article.imageUrl) {
      clearImage(article.imageUrl);
    }
    article.title = title;
    article.imageUrl = imageUrl;
    article.content = content;
    await article.save();

    res.status(200).json({ message: "Article updated!", article: article });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);    
  }
};

exports.deleteArticle = async (req, res, next) => {
  const articleId = req.params.articleId;

  try {
    const article = await Article.findById(articleId);
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
    await Article.findByIdAndRemove(articleId);

    const user = await User.findById(req.userId);
    user.posts.pull(articleId)
    await user.save();

    res.status(200).json({ message: "Deleted article." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
