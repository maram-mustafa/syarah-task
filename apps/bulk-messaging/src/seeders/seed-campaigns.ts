import {SequelizeManager, SequelizeWrapper} from "@my/sequelize";
import Campaign from "../models/Campaign.js";
import CampaignTarget from "../models/CampaignTarget.js";
import Outbox from "../models/Outbox.js";
import {appContainer} from "../app/appContainer.js";
import {App, TYPES} from "@my/common";
import crypto from "crypto";

await appContainer.run(async (app: App) => {
    try {
        const sequelizeManager: SequelizeManager = app.get<SequelizeManager>(TYPES.SequelizeManager);
        const sequelizeWrapper: SequelizeWrapper = await sequelizeManager.connection();
        const CampaignModel = sequelizeWrapper.getModel(Campaign as any);
        const CampaignTargetModel = sequelizeWrapper.getModel(CampaignTarget as any);
        const OutboxModel = sequelizeWrapper.getModel(Outbox as any);

        const campaigns = await CampaignModel.bulkCreate([
            {
                name: "Black Friday Email Blast",
                kind: "email",
                status: "running",
                scheduled_at: new Date(),
            },
            {
                name: "Holiday SMS Promo",
                kind: "sms",
                status: "running",
                scheduled_at: new Date(),
            },
            {
                name: "Push Notification - New Year",
                kind: "push",
                status: "scheduled",
                scheduled_at: new Date(Date.now() + 86400000),
            },
        ]) as any[];

        const [emailCampaign, smsCampaign, pushCampaign] = campaigns;

        const emailTargets = [
            {
                campaign_id: emailCampaign.id,
                user_ref: "alice@example.com",
                kind: "email" as const,
                timezone: "America/New_York"
            },
            {
                campaign_id: emailCampaign.id,
                user_ref: "bob@example.com",
                kind: "email" as const,
                timezone: "America/Chicago"
            },
            {
                campaign_id: emailCampaign.id,
                user_ref: "carol@example.com",
                kind: "email" as const,
                timezone: "America/Los_Angeles"
            },
            {
                campaign_id: emailCampaign.id,
                user_ref: "david@example.com",
                kind: "email" as const,
                timezone: "America/New_York"
            },
            {
                campaign_id: emailCampaign.id,
                user_ref: "ellen@example.com",
                kind: "email" as const,
                timezone: "America/Chicago"
            },
        ];

        const smsTargets = [
            {
                campaign_id: smsCampaign.id,
                user_ref: "+14155551234",
                kind: "sms" as const,
                timezone: "America/New_York"
            },
            {
                campaign_id: smsCampaign.id,
                user_ref: "+14155559876",
                kind: "sms" as const,
                timezone: "America/Chicago"
            },
            {
                campaign_id: smsCampaign.id,
                user_ref: "+14155550987",
                kind: "sms" as const,
                timezone: "America/Los_Angeles"
            },
            {
                campaign_id: smsCampaign.id,
                user_ref: "+14155552345",
                kind: "sms" as const,
                timezone: "America/New_York"
            },
            {
                campaign_id: smsCampaign.id,
                user_ref: "+14155555678",
                kind: "sms" as const,
                timezone: "America/Chicago"
            },
        ];

        const pushTargets = [
            {
                campaign_id: pushCampaign.id,
                user_ref: "device-token-abc123",
                kind: "push" as const,
                timezone: "America/New_York"
            },
            {
                campaign_id: pushCampaign.id,
                user_ref: "device-token-def456",
                kind: "push" as const,
                timezone: "America/Chicago"
            },
            {
                campaign_id: pushCampaign.id,
                user_ref: "device-token-ghi789",
                kind: "push" as const,
                timezone: "America/Los_Angeles"
            },
        ];

        const targets = await CampaignTargetModel.bulkCreate([...emailTargets, ...smsTargets, ...pushTargets]);
        console.log(`Created ${targets.length} campaign targets`);

        const outboxRecords = targets.map((t: any) => ({
            campaign_id: t.campaign_id,
            user_ref: t.user_ref,
            kind: t.kind,
            payload:
                t.kind === "email"
                    ? {
                        subject: "Black Friday Deals!",
                        body: `Hi ${t.user_ref.split("@")[0]}, enjoy 30% off everything today!`,
                        from: "noreply@syarah.com",
                    }
                    : t.kind === "sms"
                        ? {
                            body: "🎁 Holiday Deal! Text BACK to claim 20% off now!",
                            from: "+14155550000",
                        }
                        : {
                            title: "Happy New Year!",
                            body: "Welcome 2025 with exclusive deals!",
                            icon: "notification-icon.png",
                        },
            idempotency_key: crypto.createHash("sha256").update(`${t.campaign_id}:${t.user_ref}:${t.kind}`).digest("hex"),
            status: "pending",
            attempts: 0,
        }));

        const outboxes = await OutboxModel.bulkCreate(outboxRecords, {ignoreDuplicates: true});
        console.log(`✅ Created ${outboxes.length} outbox records`);

        console.log("seeder completed successfully...");
        console.log(`summary :: campaigns: ${campaigns.length} targets: ${targets.length} outbox entries: ${outboxes.length}`);
    } catch (error) {
        console.error("Seeder failed ::", error);
        throw error;
    }
});