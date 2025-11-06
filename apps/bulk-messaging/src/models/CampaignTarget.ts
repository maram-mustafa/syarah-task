import {DataTypes, Model, ModelStatic} from "sequelize";
import {SequelizeWrapper} from "@my/sequelize";

export interface CampaignTargetAttributes {
    id?: number;
    campaign_id: number;
    user_ref: string;
    kind: "email" | "sms" | "push";
    timezone?: string | null;
    metadata?: object | null;
}

export default class CampaignTarget extends Model<CampaignTargetAttributes> {
    declare id: number;
    declare campaign_id: number;
    declare user_ref: string;
    declare kind: "email" | "sms" | "push";
    declare timezone: string | null;
    declare metadata: object | null;

    static initialize(sequelizeWrapper: SequelizeWrapper): ModelStatic<CampaignTarget> {
        return sequelizeWrapper.getConnection().define<CampaignTarget>(
            "campaign_targets",
            {
                id: {
                    type: DataTypes.INTEGER, autoIncrement: true,
                    primaryKey: true
                },
                campaign_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                user_ref: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                kind: {
                    type: DataTypes.ENUM("email", "sms", "push"),
                    allowNull: false
                },
                timezone: {
                    type: DataTypes.STRING,
                    allowNull: true
                },
                metadata: {
                    type: DataTypes.JSON,
                    allowNull: true
                },
            },
            {
                tableName: "campaign_targets",
                timestamps: false,
            }
        ) as ModelStatic<CampaignTarget>;
    }
}