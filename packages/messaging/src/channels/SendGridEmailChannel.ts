import sgMail from "@sendgrid/mail";
import {IMessageChannel} from "./IMessageChannel.js";

export interface EmailChannelConfig {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
}

export class SendGridEmailChannel implements IMessageChannel {
    constructor(private config: EmailChannelConfig) {
        const apiKey = config.apiKey
        if (!apiKey) {
            throw new Error("SendGrid API key is missing");
        }
        sgMail.setApiKey(apiKey);
    }

    async send(to: string, subject: string, body: string, meta?: Record<string, any>): Promise<string> {
        const msg = {
            to,
            from: {
                email: this.config.fromEmail,
                name: this.config.fromName || "Sayara",
            },
            subject,
            text: body,
            html: meta?.html ?? body,
        };

        await sgMail.send(msg);
        return `Email sent to ${to}`;
    }
}
