const express = require("express");

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const { imageUploads } = require("../utils/multer")

const router = express.Router();


router.route("/getallusers").get(authMiddleware.protectRoute, authMiddleware.restrictTo("admin"), userController.getAllUsers);

router.route("/profile")
    .get(authMiddleware.protectRoute, userController.getUserProfile)
    .patch(authMiddleware.protectRoute, userController.updateProfile);

router.route("/update-profile-picture").patch(authMiddleware.protectRoute, imageUploads, userController.updateProfilePicture)

router.route("/updatepassword").patch(authMiddleware.protectRoute, userController.updatePassword);



module.exports = router;