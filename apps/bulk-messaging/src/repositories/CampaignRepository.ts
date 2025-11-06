import Campaign, {CampaignAttributes} from "../models/Campaign.js";
import {injectable} from "inversify";

@injectable()
export class CampaignRepository {
    async create(data: CampaignAttributes) {
        return await Campaign.create(data);
    }

    async findById(id: number) {
        return await Campaign.findByPk(id);
    }

    async findAll() {
        return await Campaign.findAll({
            order: [['id', 'DESC']]
        });
    }

    async updateStatus(id: number, status: CampaignAttributes["status"]) {
        return await Campaign.update({status}, {where: {id}});
    }
}