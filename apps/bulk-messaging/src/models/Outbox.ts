import {DataTypes, Model, ModelStatic} from "sequelize";
import {SequelizeWrapper} from "@my/sequelize";

export interface OutboxAttributes {
    id?: number;
    campaign_id: number;
    user_ref: string;
    kind: "email" | "sms" | "push";
    payload: object;
    idempotency_key: string;
    status?: "pending" | "queued" | "sent" | "failed" | "retrying";
    attempts?: number;
    last_error?: string | null;
    provider_msg_id?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export default class Outbox extends Model<OutboxAttributes> {
    declare id: number;
    declare campaign_id: number;
    declare user_ref: string;
    declare kind: "email" | "sms" | "push";
    declare payload: object;
    declare idempotency_key: string;
    declare status: "pending" | "queued" | "sent" | "failed" | "retrying";
    declare attempts: number;
    declare last_error: string | null;
    declare provider_msg_id: string | null;
    declare createdAt: Date;
    declare updatedAt: Date;

    static initialize(sequelizeWrapper: SequelizeWrapper): ModelStatic<Outbox> {
        return sequelizeWrapper.getConnection().define<Outbox>(
            "outbox",
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    field: 'id'
                },
                campaign_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    field: 'campaign_id'
                },
                user_ref: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'user_ref'
                },
                kind: {
                    type: DataTypes.ENUM("email", "sms", "push"),
                    allowNull: false,
                    field: 'kind'
                },
                payload: {
                    type: DataTypes.JSON,
                    allowNull: false,
                    field: 'payload'
                },
                idempotency_key: {
                    type: DataTypes.STRING,
                    unique: true,
                    allowNull: false,
                    field: 'idempotency_key'
                },
                status: {
                    type: DataTypes.ENUM("pending", "queued", "sent", "failed", "retrying"),
                    defaultValue: "pending",
                    field: 'status'
                },
                attempts: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
                    field: 'attempts'
                },
                last_error: {
                    type: DataTypes.STRING,
                    field: 'last_error'
                },
                provider_msg_id: {
                    type: DataTypes.STRING,
                    field: 'provider_msg_id'
                },
            },
            {
                tableName: "outbox",
                timestamps: true,
                createdAt: 'createdAt',
                updatedAt: 'updatedAt',
            }
        ) as ModelStatic<Outbox>;
    }
}