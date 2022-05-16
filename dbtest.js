const mysql = require("mysql");
require("dotenv").config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// pool.getConnection(function (err, connection) {
//   if (err) next (err); // not connected!

//   // Use the connection
//   connection.query(
//     "SELECT id, name FROM meal;",
//     function (error, results, fields) {
//       // When done with the connection, release it.
//       connection.release();

//       // Handle error after the release.
//       if (error) next (err);

//       // Don't use the connection here, it has been returned to the pool.
//       logger.debug("result = ", results);

//       pool.end((err) => {
//         logger.debug("pool was closed.");
//       });
//     }
//   );
// });

pool.on("acquire", function (connection) {
  logger.debug("Connection %d acquired", connection.threadId);
});

pool.on("release", function (connection) {
  logger.debug("Connection %d released", connection.threadId);
});

module.exports = pool;
