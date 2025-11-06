import twilio from "twilio";
import {IMessageChannel} from "./IMessageChannel.js";

export interface SmsChannelConfig {
    accountSid: string;
    authToken: string;
    senderId: string;
}

export class TwilioSmsChannel implements IMessageChannel {
    private client: twilio.Twilio;

    constructor(private config: SmsChannelConfig) {
        this.client = twilio(config.accountSid, config.authToken);
    }

    async send(to: string, subject: string, body: string): Promise<string> {
        try {
            const result = await this.client.messages.create({
                from: this.config.senderId,
                to,
                body,
            });
            return `SMS sent to ${to}, sid=${result.sid}`;
        } catch (err: any) {
            throw new Error(`SMS send failed: ${err.message || err}`);
        }
    }
}