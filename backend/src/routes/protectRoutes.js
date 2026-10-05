const express = require("express");

const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");

const { imageUploads } = require("../utils/multer");


const router = express.Router();

router.route("/createproduct").post(authMiddleware.protectRoute, authMiddleware.restrictTo("instructor", "admin"), imageUploads, productController.createNewProduct);

router.route("/getallproduct").get(authMiddleware.protectRoute, productController.getAllProducts);
router.route("/my-products").get(authMiddleware.protectRoute, productController.getMyProducts);

router.route("/:id")
    .get(authMiddleware.protectRoute, productController.getProductDetails)
    .patch(authMiddleware.protectRoute, authMiddleware.restrictTo("instructor", "admin"), productController.updateProductDetails)
    .delete(authMiddleware.protectRoute, authMiddleware.restrictTo("instructor", "admin"), productController.deleteProduct)


module.exports = router;