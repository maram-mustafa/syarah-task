import {inject, injectable} from "inversify";
import {MessagingManager} from "@my/messaging";
import {TYPES} from "@my/common";

interface OutboxMessage {
    id: number;
    campaign_id: number;
    user_ref: string;
    kind: "email" | "sms" | "push";
    payload: {
        subject?: string;
        body: string;
        [key: string]: any;
    };
}

@injectable()
export class NotificationService {
    constructor(
        @inject(TYPES.MessagingManager) private messagingManager: MessagingManager
    ) {
    }

    async processOutboxMessage(message: {
        id: number;
        campaign_id: number;
        user_ref: string;
        kind: "email" | "sms" | "push";
        payload: any;
        attempts: number
    }): Promise<{ success: boolean; providerId?: string; error?: string }> {
        try {
            console.log(`NotificationService Sending ${message.kind} to ${message.user_ref}`);

            const providerId = await this.sendMessage(message);

            console.log(`NotificationService Sent successfully. Provider ID: ${providerId}`);
            return {success: true, providerId};
        } catch (error: any) {
            console.error(`NotificationService Send failed: ${error.message}`);
            return {success: false, error: error.message};
        }
    }

    private async sendMessage(message: OutboxMessage): Promise<string> {
        switch (message.kind) {
            case "email":
                return await this.sendEmail(message);
            default:
                throw new Error(`Unsupported message kind: ${message.kind}`);
        }
    }

    private async sendEmail(message: OutboxMessage): Promise<string> {
        const emailChannel = await this.messagingManager.channel("emailChannel");
        return await emailChannel.send(
            message.user_ref,
            message.payload.subject || "Notification",
            message.payload.body,
            message.payload
        );
    }
}