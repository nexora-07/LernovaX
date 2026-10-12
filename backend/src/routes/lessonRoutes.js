const lessonController = require("../controllers/lessonController");
const authMiddleware = require("../middleware/authMiddleware");
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const express = require("express");

const router = express.Router();

router.post(
  "/createlesson",
  protectRoute,
  restrictTo("instructor", "admin"),
  lessonController.createLesson
);

// route to get all lessons
router.get("/", lessonController.getLessons);

//route to get a lesson by id
router.get("/:id", lessonController.getLesson);

//route to update a lesson by id
router.patch(
  "/:id",
  protectRoute,
  restrictTo("instructor", "admin"),
  lessonController.updateLesson
);

//route to delete a lesson by id
router.delete(
  "/:id",
  protectRoute,
  restrictTo("instructor", "admin"),
  lessonController.deleteLesson
);


module.exports = router;