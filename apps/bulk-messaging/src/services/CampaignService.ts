import {CampaignRepository} from "../repositories/CampaignRepository.js";
import {CampaignTargetRepository} from "../repositories/CampaignTargetRepository.js";
import {OutboxRepository} from "../repositories/OutboxRepository.js";
import {inject, injectable} from "inversify";
import crypto from "crypto";

interface CampaignData {
    name: string;
    kind: "email" | "sms";
    scheduled_at?: Date;
    messageTemplate: {
        subject?: string;
        body: string;
    };
}

@injectable()
export class CampaignService {
    constructor(
        @inject("CampaignRepository") private campaignRepo: CampaignRepository,
        @inject("CampaignTargetRepository") private targetRepo: CampaignTargetRepository,
        @inject("OutboxRepository") private outboxRepo: OutboxRepository,
    ) {}

    async createCampaign(data: CampaignData) {
        return await this.campaignRepo.create({
            name: data.name,
            kind: data.kind,
            scheduled_at: data.scheduled_at || null,
        });
    }

    async prepareCampaign(campaignId: number, messageTemplate: any) {
        const campaign = await this.campaignRepo.findById(campaignId);
        if (!campaign) {
            throw new Error(`Campaign ${campaignId} not found`);
        }

        await this.campaignRepo.updateStatus(campaignId, "running");

        const BATCH_SIZE = 1000;
        let offset = 0;
        let totalProcessed = 0;

        while (true) {
            const targets = await this.targetRepo.getTargetsBatch(
                campaignId,
                offset,
                BATCH_SIZE
            );

            if (targets.length === 0) break;

            const outboxRecords = targets.map((t: any) => ({
                campaign_id: campaignId,
                user_ref: t.user_ref,
                kind: t.kind,
                payload: {
                    subject: messageTemplate.subject || "Marketing Message",
                    body: this.renderTemplate(messageTemplate.body, t.metadata),
                    ...t.metadata,
                },
                idempotency_key: this.generateIdempotencyKey(campaignId, t.user_ref, t.kind),
            }));

            await this.outboxRepo.createBatch(outboxRecords);

            totalProcessed += targets.length;
            offset += BATCH_SIZE;

            console.log(`[Prepare] Processed ${totalProcessed} targets for campaign ${campaignId}`);
        }

        console.log(`[Prepare] Campaign ${campaignId} preparation complete. Total: ${totalProcessed}`);
        return totalProcessed;
    }

    async getCampaignProgress(campaignId: number) {
        const stats = await this.outboxRepo.getCampaignStats(campaignId);
        const campaign = await this.campaignRepo.findById(campaignId);

        const statMap = stats.reduce((acc: any, stat: any) => {
            acc[stat.status] = parseInt(stat.count);
            return acc;
        }, {});

        return {
            campaign,
            stats: {
                pending: statMap.pending || 0,
                queued: statMap.queued || 0,
                sent: statMap.sent || 0,
                failed: statMap.failed || 0,
                retrying: statMap.retrying || 0,
                total: stats.reduce((sum: number, s: any) => sum + parseInt(s.count), 0)
            }
        };
    }

    async listCampaigns() {
        const campaigns = await this.campaignRepo.findAll();
        const campaignsWithStats = [];

        for (const campaign of campaigns) {
            const progress = await this.getCampaignProgress(campaign.id);
            campaignsWithStats.push({
                ...campaign.toJSON(),
                progress: progress.stats
            });
        }

        return campaignsWithStats;
    }

    private renderTemplate(template: string, metadata: any): string {
        if (!metadata) return template;

        let rendered = template;
        for (const [key, value] of Object.entries(metadata)) {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), String(value));
        }
        return rendered;
    }

    private generateIdempotencyKey(campaignId: number, userRef: string, kind: string): string {
        const data = `${campaignId}:${userRef}:${kind}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }
}