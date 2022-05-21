const express = require("express");
const router = express.Router();
const mealController = require("../controllers/meal.controller");
const authController = require("../controllers/authentication.controller");
const authenticationController = require("../controllers/authentication.controller");

router.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    result: "Hello World",
  });
});

// UC-302 Update meal //OPTIONEEL
router.put(
  "/api/meal/:mealId",
  authenticationController.validateToken,
  mealController.validateMeal,
  mealController.updateSingleMeal
);

// UC-303 Get all meals
router.get("/api/meal", mealController.getAllMeals);

// UC-304 Get single meal details
router.get("/api/meal/:mealId", mealController.getMealById);

// UC-305 Delete a meal
router.delete(
  "/api/meal/:mealId",
  authenticationController.validateToken,
  mealController.deleteSingleMeal
);

// UC-301 Create meal
router.post(
  "/api/meal",
  authenticationController.validateToken,
  mealController.validateMeal,
  mealController.addMeal
);

module.exports = router;
