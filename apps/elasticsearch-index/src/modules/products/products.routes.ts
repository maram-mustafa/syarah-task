import {RequestHandler, Router} from "express";
import {ProductsController} from "./products.controller.js";

const router: Router = Router();

router.get(
    "/product/search",
    ProductsController.searchProducts as RequestHandler
);

router.get(
    "/product",
    ProductsController.listProducts as RequestHandler
);

router.post(
    "/product",
    ProductsController.createProduct as RequestHandler
);

router.get(
    "/product/:productId",
    ProductsController.getProductByID as RequestHandler
);

router.put(
    "/product/:productId",
    ProductsController.updateProductById as RequestHandler
);


router.delete(
    "/product/:productId",
    ProductsController.deleteProduct as RequestHandler
);

export default router;
