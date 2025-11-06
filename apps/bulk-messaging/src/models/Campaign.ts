import {DataTypes, Model, ModelStatic} from "sequelize";
import CampaignTarget from "./CampaignTarget.js";
import Outbox from "./Outbox.js";
import {SequelizeWrapper} from "@my/sequelize";

export interface CampaignAttributes {
    id?: number;
    name: string;
    kind: "email" | "sms" | "push";
    status?: "draft" | "scheduled" | "running" | "paused" | "completed" | "failed";
    scheduled_at?: Date | null;
}

export default class Campaign extends Model<CampaignAttributes> {
    declare id: number;
    declare name: string;
    declare kind: "email" | "sms" | "push";
    declare status: "draft" | "scheduled" | "running" | "paused" | "completed" | "failed";
    declare scheduled_at: Date | null;

    static initialize(sequelizeWrapper: SequelizeWrapper): ModelStatic<Campaign> {
        return sequelizeWrapper.getConnection().define<Campaign>(
            "campaigns",
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                kind: {
                    type: DataTypes.ENUM("email", "sms", "push"),
                    allowNull: false
                },
                status: {
                    type: DataTypes.ENUM("draft", "scheduled", "running", "paused", "completed", "failed"),
                    defaultValue: "draft",
                },
                scheduled_at: {
                    type: DataTypes.DATE,
                    allowNull: true
                },
            },
            {
                tableName: "campaigns",
                timestamps: false,
            }
        ) as ModelStatic<Campaign>;
    }

    static relations(sequelizeWrapper: SequelizeWrapper) {
        const CampaignTargetModel = sequelizeWrapper.getModel(CampaignTarget as any);
        const OutboxModel = sequelizeWrapper.getModel(Outbox as any);

        sequelizeWrapper.getModel(Campaign as any).hasMany(CampaignTargetModel, {
            foreignKey: "campaign_id",
            as: "targets",
        });

        sequelizeWrapper.getModel(Campaign as any).hasMany(OutboxModel, {
            foreignKey: "campaign_id",
            as: "outbox_entries",
        });
    }
}