//OPTIONEEL
process.env.DB_DATABASE = process.env.DB_DATABASE || "share-a-meal";
process.env.LOGLEVEL = "warn"; //warn

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
const assert = require("assert");
require("dotenv").config();
const dbconnection = require("../../src/database/dbconnection");
const jwt = require("jsonwebtoken");
const { jwtSecretKey, logger } = require("../../src/config/config");
const {
  validateToken,
} = require("../../src/controllers/authentication.controller");

chai.should();
chai.use(chaiHttp);

/**
 * Db queries to clear and fill the test database before each test.
 */
const CLEAR_MEAL_TABLE = "DELETE IGNORE FROM `meal`;";
const CLEAR_PARTICIPANTS_TABLE = "DELETE IGNORE FROM `meal_participants_user`;";
const CLEAR_USERS_TABLE = "DELETE IGNORE FROM `user`;";
const CLEAR_DB =
  CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

/**
 * Voeg een user toe aan de database. Deze user heeft id 1.
 * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
 */
const INSERT_USER =
  "INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES" +
  '(1, "first", "last", "name@server.nl", "secret", "street", "city");';

const INSERT_SECONDUSER =
  "INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `phoneNumber` ) VALUES" +
  '(2, "Pietje", "Precies", "pietje@precies.nl", "PietjePrecies=123", "Laan", "Amsterdam", "0612345678");';

/**
 * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
 * met een bestaande user in de database.
 */
const INSERT_MEALS =
  "INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES" +
  "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
  "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);";

describe("UC-302-3 Update Meal", (done) => {
  beforeEach((done) => {
    logger.debug("beforeEach called");
    // maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query(
        CLEAR_DB + INSERT_USER + INSERT_MEALS + INSERT_SECONDUSER,
        function (error, results, fields) {
          // When done with the connection, release it.
          connection.release();

          // Handle error after the release.
          if (error) next(err);
          // done() aanroepen nu je de query callback eindigt.
          logger.debug("beforeEach done");
          done();
        }
      );
    });

    chai
      .request(server)
      .post("/api/auth/login")
      .send({ emailAdress: "pietje@precies.nl", password: "PietjePrecies=123" })
      .end((err, res) => {
        logger.info("#RES.BODY beforeEach");
        logger.info(res.body);
      });
  });

  it("TC-302-3 Actor is no owner, return 403 response", (done) => {
    chai
      .request(server)
      .put("/api/meal/1")
      .set("authorization", "Bearer " + jwt.sign({ id: 2 }, jwtSecretKey))
      .send({
        name: "Spaghetti Bolognese",
        description: "Dé pastaklassieker bij uitstek.",
        isActive: true,
        isVega: true,
        isVegan: true,
        isToTakeHome: true,
        dateTime: "2022-05-20T08:30:53.232Z",
        imageUrl:
          "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
        maxAmountOfParticipants: 6,
        price: 6.75,
      })
      .end((err, res) => {
        logger.info("res.body (chai): ");
        logger.info(res.body);
        res.should.be.an("object");
        let { status, result } = res.body;
        res.should.have.status(403);
        res.body.message.should.be
          .a("string")
          .that.equals(`You are no owner of meal with id = 1`);
        done();
      });
  });
});

describe("UC-302-1/2/4/5 Update Meal", (done) => {
  beforeEach((done) => {
    logger.debug("beforeEach called");
    // maak de testdatabase leeg zodat we onze testen kunnen uitvoeren.
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query(
        CLEAR_DB + INSERT_USER + INSERT_MEALS,
        function (error, results, fields) {
          // When done with the connection, release it.
          connection.release();

          // Handle error after the release.
          if (error) next(err);
          // done() aanroepen nu je de query callback eindigt.
          logger.debug("beforeEach done");
          done();
        }
      );
    });

    chai
      .request(server)
      .post("/api/auth/login")
      .send({ emailAdress: "name@server.nl", password: "secret" })
      .end((err, res) => {
        logger.info(res.body);
      });
  });

  it("TC-302-1 A required field is missing, return 400 response", (done) => {
    chai
      .request(server)
      .put("/api/meal/1")
      .set("authorization", "Bearer " + jwt.sign({ id: 1 }, jwtSecretKey))
      .send({
        //name ontbreekt
        description: "Dé pastaklassieker bij uitstek.",
        isActive: true,
        isVega: true,
        isVegan: true,
        isToTakeHome: true,
        dateTime: "2022-05-20T08:30:53.232Z",
        imageUrl:
          "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
        maxAmountOfParticipants: 6,
        price: 6.75,
      })
      .end((err, res) => {
        logger.debug(res.status);
        res.should.be.an("object");
        let { status, result } = res.body;
        res.status.should.eql(400);
        res.body.results.should.be
          .a("string")
          .that.equals("Name of meal must be a string");
        done();
      });
  });

  it("TC-302-2 Not logged in, return 401 response", (done) => {
    chai
      .request(server)
      .put("/api/meal/1")
      .set("authorization", "Bearer " + "thisisatoken")
      .send({
        name: "Spaghetti Bolognese",
        description: "Dé pastaklassieker bij uitstek.",
        isActive: true,
        isVega: true,
        isVegan: true,
        isToTakeHome: true,
        dateTime: "2022-05-20T08:30:53.232Z",
        imageUrl:
          "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
        maxAmountOfParticipants: 6,
        price: 6.75,
      })
      .end((err, res) => {
        logger.debug(res.body);
        res.should.be.an("object");
        let { status, result } = res.body;
        res.should.have.status(401);
        res.body.error.should.be.a("string").that.equals("Not authorized");
        done();
      });
  });

  it("TC-302-4 Meal doesn't exist, return 404 response", (done) => {
    chai
      .request(server)
      .put("/api/meal/3")
      .set("authorization", "Bearer " + jwt.sign({ id: 1 }, jwtSecretKey))
      .send({
        name: "Spaghetti Bolognese",
        description: "Dé pastaklassieker bij uitstek.",
        isActive: true,
        isVega: true,
        isVegan: true,
        isToTakeHome: true,
        dateTime: "2022-05-20T08:30:53.232Z",
        imageUrl:
          "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
        maxAmountOfParticipants: 6,
        price: 6.75,
      })
      .end((err, res) => {
        res.should.be.an("object");
        let { status, result } = res.body;
        res.should.have.status(404);
        res.body.message.should.be
          .a("string")
          .that.equals("Meal with ID 3 not found");
        done();
      });
  });

  it("TC-302-5 Meal successfully updated, return 200 response", (done) => {
    chai
      .request(server)
      .put("/api/meal/1")
      .set("authorization", "Bearer " + jwt.sign({ id: 1 }, jwtSecretKey))
      .send({
        name: "Spaghetti Bolognese",
        description: "Dé pastaklassieker bij uitstek.",
        isActive: true,
        isVega: true,
        isVegan: true,
        isToTakeHome: true,
        dateTime: "2022-05-20T08:30:53.232Z",
        imageUrl:
          "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
        maxAmountOfParticipants: 6,
        price: 6.75,
      })
      .end((err, res) => {
        let { status, result } = res.body;
        logger.info("#RES>BODY");
        logger.info(res.body);
        res.should.have.status(200);
        res.body.results.should.have
          .property("id")
          .and.to.be.a("number")
          .that.equals(1);
        res.body.results.should.have
          .property("isActive")
          .and.to.be.a("number")
          .that.equals(0);
        res.body.results.should.have
          .property("isVega")
          .and.to.be.a("number")
          .that.equals(0);
        res.body.results.should.have
          .property("isVegan")
          .and.to.be.a("number")
          .that.equals(0);
        res.body.results.should.have
          .property("isToTakeHome")
          .and.to.be.a("number")
          .that.equals(1);
        res.body.results.should.have
          .property("maxAmountOfParticipants")
          .and.to.be.a("number")
          .that.equals(6);
        res.body.results.should.have
          .property("price")
          .and.to.be.a("string")
          .that.equals("6.75");
        res.body.results.should.have
          .property("imageUrl")
          .and.to.be.a("string")
          .that.equals(
            "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg"
          );
        res.body.results.should.have
          .property("cookId")
          .and.to.be.a("number")
          .that.equals(1);
        res.body.results.should.have
          .property("name")
          .and.to.be.a("string")
          .that.equals("Spaghetti Bolognese");
        res.body.results.should.have
          .property("description")
          .and.to.be.a("string")
          .that.equals("Dé pastaklassieker bij uitstek.");
        done();
      });
  });
});
