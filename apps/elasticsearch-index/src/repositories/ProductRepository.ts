import { injectable, inject } from "inversify";
import Product, { ProductAttributes } from "../models/Product.js";
import { FindOptions, ModelStatic } from "sequelize";
import { SequelizeManager, SequelizeWrapper } from "@my/sequelize";
import { TYPES } from "@my/common";

@injectable()
export class ProductRepository {
    private sequelizeWrapper!: SequelizeWrapper;
    private ProductModel!: ModelStatic<Product>;

    constructor(
        @inject(TYPES.SequelizeManager) private sequelizeManager: SequelizeManager
    ) {}

    async initialize() {
        if (!this.sequelizeWrapper) {
            this.sequelizeWrapper = await this.sequelizeManager.connection();
            this.ProductModel = this.sequelizeWrapper.getModel(Product as any);
        }
    }

    async create(data: ProductAttributes): Promise<Product> {
        await this.initialize();
        return await this.ProductModel.create(data);
    }

    async findById(id: number): Promise<Product | null> {
        await this.initialize();
        return await this.ProductModel.findByPk(id);
    }

    async findBySku(sku: string): Promise<Product | null> {
        await this.initialize();
        return await this.ProductModel.findOne({ where: { sku } });
    }

    async findAll(options?: FindOptions<ProductAttributes>): Promise<Product[]> {
        await this.initialize();
        return await this.ProductModel.findAll(options);
    }

    async count(): Promise<number> {
        await this.initialize();
        return await this.ProductModel.count();
    }

    async findBatch(batchSize: number, offset: number): Promise<Product[]> {
        await this.initialize();
        return await this.ProductModel.findAll({
            limit: batchSize,
            offset: offset,
            order: [['id', 'ASC']],
        });
    }

    async update(id: number, data: Partial<ProductAttributes>): Promise<[number]> {
        await this.initialize();
        return await this.ProductModel.update(data, { where: { id } });
    }

    async delete(id: number): Promise<number> {
        await this.initialize();
        return await this.ProductModel.destroy({ where: { id } });
    }
}