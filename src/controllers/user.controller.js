const assert = require("assert");

let database = [];
let id = 0;

let controller = {
  validateUser: (req, res, next) => {
    let user = req.body;
    let { firstName, lastName, emailAdress, password } = user;
    try {
      assert(typeof firstName === "string", "First Name must be a string");
      assert(typeof lastName === "string", "Last Name must be a string");

      next();
    } catch (err) {
      console.log(err.code);
      console.log(err.message);
      res.status(400).json({
        status: 400,
        result: err.toString,
      });
    }
  },
  addUser: (req, res) => {
    let user = req.body;
    id++;
    user = {
      id,
      ...user,
    };
    console.log(user);
    database.push(user);
    res.status(201).json({
      status: 201,
      result: database,
    });
  },
  getAllUsers: (req, res) => {
    res.status(200).json({
      status: 200,
      result: database,
    });
  },
  getUserById: (req, res) => {
    const userId = req.params.userId;
    console.log(`User met ID ${userId} gezocht`);
    let user = database.filter((item) => item.id == userId);
    if (user.length > 0) {
      console.log(user);
      res.status(200).json({
        status: 200,
        result: user,
      });
    } else {
      res.status(401).json({
        status: 401,
        result: `User with ID ${userId} not found`,
      });
    }
  },
};

module.exports = controller;