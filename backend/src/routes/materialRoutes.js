const materialController = require("../controllers/materialsController");
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const { fileUploads } = require("../utils/multer");
const express = require("express");

const router = express.Router();

//to create a material
router.post(
  "/create-material",
  protectRoute,
  restrictTo("instructor", "admin"),
  fileUploads,
  materialController.createMaterial
);


//route to get all materials
router.get("/all", materialController.getAllMaterials);

//route to get all materials belonging to a lesson
router.get("/lesson/:lessonId", materialController.getLessonMaterials);

//route to get a material by id
router.route("/:id")
    .get(materialController.getMaterialById)
    .patch(protectRoute, restrictTo("instructor", "admin"), fileUploads, materialController.updateMaterial)
    .delete(protectRoute, restrictTo("instructor", "admin"), materialController.deleteMaterial);


module.exports = router;