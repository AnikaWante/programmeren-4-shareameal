//
// Authentication routes
//
const routes = require("express").Router();
const AuthController = require("../controllers/authentication.controller");

routes.post(
  "/api/auth/login",
  AuthController.validateLogin,
  AuthController.login
);

module.exports = routes;
