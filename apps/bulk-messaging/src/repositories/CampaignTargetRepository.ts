import CampaignTarget, {CampaignTargetAttributes} from "../models/CampaignTarget.js";
import {injectable} from "inversify";

@injectable()
export class CampaignTargetRepository {
    async createBatch(targets: CampaignTargetAttributes[]) {
        return await CampaignTarget.bulkCreate(targets);
    }

    async getTargetsBatch(campaignId: number, offset: number, limit: number) {
        return await CampaignTarget.findAll({
            where: {campaign_id: campaignId},
            offset,
            limit,
            order: [["id", "ASC"]],
        });
    }

    async countTargets(campaignId: number) {
        return await CampaignTarget.count({
            where: {campaign_id: campaignId},
        });
    }
}