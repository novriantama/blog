const express = require("express");

const validator = require("../middleware/validators/articleValidator");

const articleController = require("../controllers/article");
const commentController = require("../controllers/comment");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/articles", articleController.getArticles);

router.get("/article/:articleId", articleController.getArticle);

router.post(
  "/article",
  isAuth,
  validator.articleValidation,
  articleController.createArticle
);

router.put(
  "/article/:articleId",
  isAuth,
  validator.articleValidation,
  articleController.updateArticle
);

router.delete("/article/:articleId", isAuth, articleController.deleteArticle);

router.get("/article/:articleId/comments", commentController.getComments);

router.post(
  "/article/:articleId/comment",
  isAuth,
  commentController.createComment
);

router.delete(
  "/article/:articleId/comment/:commentId",
  isAuth,
  commentController.deleteComment
);

module.exports = router;
