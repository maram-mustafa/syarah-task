import {NextFunction, Request, Response} from "express";
import {appContainer} from "../../app/appContainer.js";
import {ProductService} from "../../services/ProductService.js";

export class ProductsController {
    public static listProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productService = appContainer.get<ProductService>("ProductService");
            const status = req.query.status as "active" | "inactive" | "discontinued" | undefined;
            const category = req.query.category as string | undefined;
            const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
            const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const filters = {
                status,
                category,
                minPrice,
                maxPrice,
            };

            const result = await productService.listProducts(filters, limit, offset);

            res.status(200).json({
                success: true,
                data: result.products,
                pagination: {
                    total: result.total,
                    limit,
                    offset,
                    hasMore: offset + limit < result.total,
                },
            });
        } catch (error: any) {
            console.error("error :: listProducts :: ", error);
            next(error);
        }
    };

    public static getProductByID = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productService = appContainer.get<ProductService>("ProductService");
            const productId = parseInt(req.params.productId);

            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid product ID",
                });
            }

            const product = await productService.getProductById(productId);

            res.status(200).json({
                success: true,
                data: product,
            });
        } catch (error: any) {
            console.error("error :: getProductByID :: ", error);
            if (error.message?.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    };

    public static createProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productService = appContainer.get<ProductService>("ProductService");

            const {name, sku, price} = req.body;
            if (!name || !sku || price === undefined) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields: name, sku, price",
                });
            }

            const productData = {
                name: req.body.name,
                description: req.body.description,
                sku: req.body.sku,
                price: parseFloat(req.body.price),
                category: req.body.category,
                stock_quantity: req.body.stock_quantity ? parseInt(req.body.stock_quantity) : 0,
                status: req.body.status || "active",
                tags: req.body.tags || [],
            };

            const product = await productService.createProduct(productData);

            res.status(201).json({
                success: true,
                message: "Product created successfully",
                data: product,
            });
        } catch (error: any) {
            console.error("error :: createProduct :: ", error);
            if (error.message?.includes("already exists")) {
                return res.status(409).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    };

    public static updateProductById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productService = appContainer.get<ProductService>("ProductService");
            const productId = parseInt(req.params.productId);

            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid product ID...",
                });
            }

            const updateData: any = {};
            if (req.body.name !== undefined) updateData.name = req.body.name;
            if (req.body.description !== undefined) updateData.description = req.body.description;
            if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
            if (req.body.category !== undefined) updateData.category = req.body.category;
            if (req.body.stock_quantity !== undefined) updateData.stock_quantity = parseInt(req.body.stock_quantity);
            if (req.body.status !== undefined) updateData.status = req.body.status;
            if (req.body.tags !== undefined) updateData.tags = req.body.tags;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "No fields to update",
                });
            }

            const product = await productService.updateProduct(productId, updateData);

            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                data: product,
            });
        } catch (error: any) {
            console.error("error :: updateProduct :: ", error);
            if (error.message?.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    };

    public static deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productService = appContainer.get<ProductService>("ProductService");
            const productId = parseInt(req.params.productId);

            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid product ID",
                });
            }

            await productService.deleteProduct(productId);

            res.status(200).json({
                success: true,
                message: "Product deleted successfully",
            });
        } catch (error: any) {
            console.error("error :: deleteProduct :: ", error);
            if (error.message?.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    };

    public static searchProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productService = appContainer.get<ProductService>("ProductService");
            const query = req.query.q as string;

            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: "Search query is required...",
                });
            }

            const products = await productService.searchProducts(query);

            res.status(200).json({
                success: true,
                data: products,
                count: products.length,
            });
        } catch (error: any) {
            console.error("error :: searchProducts :: ", error);
            next(error);
        }
    };
}