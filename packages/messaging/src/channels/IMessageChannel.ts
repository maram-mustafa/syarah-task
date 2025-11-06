export interface IMessageChannel {
    send(to: string, subject: string, body: string, meta?: Record<string, any>): Promise<string>;
}