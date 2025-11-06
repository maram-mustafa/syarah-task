import {inject, injectable} from "inversify";
import {ProductRepository} from "../repositories/ProductRepository.js";
import {ProductAttributes} from "../models/Product.js";
import Product from "../models/Product.js";
import {TYPES, ConnectionManager, RabbitMQConnection} from "@my/common";
import {Op} from "sequelize";

interface CreateProductData {
    name: string;
    description?: string;
    sku: string;
    price: number;
    category?: string;
    stock_quantity?: number;
    status?: "active" | "inactive" | "discontinued";
    tags?: string[];
}

interface UpdateProductData {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    stock_quantity?: number;
    status?: "active" | "inactive" | "discontinued";
    tags?: string[];
}

interface ProductFilters {
    status?: "active" | "inactive" | "discontinued";
    category?: string;
    minPrice?: number;
    maxPrice?: number;
}

@injectable()
export class ProductService {
    constructor(
        @inject("ProductRepository") private productRepo: ProductRepository,
        @inject(TYPES.ConnectionManager) private connectionManager: ConnectionManager
    ) {}

    async createProduct(data: CreateProductData): Promise<Product> {
        const existing = await this.productRepo.findBySku(data.sku);
        if (existing) {
            throw new Error(`Product with SKU ${data.sku} already exists`);
        }

        const product = await this.productRepo.create({
            name: data.name,
            description: data.description,
            sku: data.sku,
            price: data.price,
            category: data.category,
            stock_quantity: data.stock_quantity ?? 0,
            status: data.status ?? "active",
            tags: data.tags ? JSON.stringify(data.tags) : undefined,
        });

        await this.publishSyncEvent("index", product.id);

        return product;
    }

    async getProductById(id: number): Promise<Product> {
        const product = await this.productRepo.findById(id);
        if (!product) {
            throw new Error(`Product with ID ${id} not found`);
        }
        return product;
    }

    async updateProduct(id: number, data: UpdateProductData): Promise<Product> {
        const product = await this.getProductById(id);
        const updateData: Partial<ProductAttributes> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

        await this.productRepo.update(id, updateData);

        await this.publishSyncEvent("update", id);

        return await this.getProductById(id);
    }

    async deleteProduct(id: number): Promise<void> {
        await this.getProductById(id);

        await this.productRepo.delete(id);

        await this.publishSyncEvent("delete", id);
    }

    async listProducts(filters?: ProductFilters, limit?: number, offset?: number): Promise<{
        products: Product[];
        total: number;
    }> {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
            where.price = {};
            if (filters.minPrice !== undefined) {
                where.price[Op.gte] = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                where.price[Op.lte] = filters.maxPrice;
            }
        }

        const products = await this.productRepo.findAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });

        const total = await this.productRepo.count();

        return {products, total};
    }

    async bulkCreateProducts(productsData: CreateProductData[]): Promise<Product[]> {
        const createdProducts: Product[] = [];

        for (const data of productsData) {
            try {
                const product = await this.createProduct(data);
                createdProducts.push(product);
            } catch (error) {
                console.error(`Failed to create product with SKU ${data.sku}:`, error);
            }
        }

        return createdProducts;
    }

    async getProductStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byCategory: Record<string, number>;
        totalValue: number
    }> {
        const products = await this.productRepo.findAll();

        const stats = {
            total: products.length,
            byStatus: {} as Record<string, number>,
            byCategory: {} as Record<string, number>,
            totalValue: 0,
        };

        products.forEach(product => {
            stats.byStatus[product.status] = (stats.byStatus[product.status] || 0) + 1;

            const category = product.category || "uncategorized";
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            stats.totalValue += parseFloat(product.price.toString()) * product.stock_quantity;
        });

        return stats;
    }

    async searchProducts(query: string): Promise<Product[]> {
        const products = await this.productRepo.findAll();

        const searchQuery = query.toLowerCase();

        return products.filter(product =>
            product.name.toLowerCase().includes(searchQuery) ||
            (product.description && product.description.toLowerCase().includes(searchQuery))
        );
    }

    private async publishSyncEvent(operation: "index" | "update" | "delete", productId: number): Promise<void> {
        try {
            const rabbitmq = await this.connectionManager.resolve<RabbitMQConnection>("rabbitmqCon");

            const exchange = process.env.RABBITMQ_SYNC_EXCHANGE || "product_sync";
            const routingKey = `product.${operation}`;

            await rabbitmq.publishToExchange(
                exchange,
                routingKey,
                {
                    operation,
                    productId,
                    timestamp: new Date().toISOString()
                }
            );

            console.log(`✓ Published sync event: ${operation} for product ${productId}`);
        } catch (error) {
            console.error(`Failed to publish sync event for product ${productId}:`, error);
        }
    }
}