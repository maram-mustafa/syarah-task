import { DataTypes, Model, ModelStatic } from "sequelize";
import { SequelizeWrapper } from "@my/sequelize";

export interface ProductAttributes {
    id?: number;
    name: string;
    description?: string;
    sku: string;
    price: number;
    category?: string;
    stock_quantity?: number;
    status?: "active" | "inactive" | "discontinued";
    tags?: string;
    created_at?: Date;
    updated_at?: Date;
}

export default class Product extends Model<ProductAttributes> {
    declare id: number;
    declare name: string;
    declare description: string | null;
    declare sku: string;
    declare price: number;
    declare category: string | null;
    declare stock_quantity: number;
    declare status: "active" | "inactive" | "discontinued";
    declare tags: string | null;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;

    static initialize(sequelizeWrapper: SequelizeWrapper): ModelStatic<Product> {
        return sequelizeWrapper.getConnection().define<Product>(
            "products",
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                sku: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    unique: true,
                },
                price: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0.00,
                },
                category: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
                },
                stock_quantity: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                status: {
                    type: DataTypes.ENUM("active", "inactive", "discontinued"),
                    allowNull: false,
                    defaultValue: "active",
                },
                tags: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
            },
            {
                tableName: "products",
                timestamps: true,
                underscored: true,
                indexes: [
                    {
                        name: "idx_sku",
                        fields: ["sku"],
                    },
                    {
                        name: "idx_status",
                        fields: ["status"],
                    },
                    {
                        name: "idx_category",
                        fields: ["category"],
                    },
                    {
                        name: "idx_updated_at",
                        fields: ["updated_at"],
                    },
                ],
            }
        ) as ModelStatic<Product>;
    }
}