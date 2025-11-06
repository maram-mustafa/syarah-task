import IDriver from "../drivers/IDriver.js";
import client, {ConfirmChannel, ConsumeMessage, Options, ChannelModel} from "amqplib";
import {randomUUID} from "node:crypto";

export type RabbitMQConfig = {
    publishChannel: boolean,
    connectionConfig: string | Options.Connect
};

export class RabbitMQConnection {
    private connection!: ChannelModel;
    private isConnecting: boolean = false;
    private publishConfirmChannel?: ConfirmChannel;
    private readonly config: RabbitMQConfig;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;

    constructor(config: RabbitMQConfig) {
        console.log("config :: ", config);
        this.config = config;
    }

    async connect(): Promise<void> {
        try {
            if (this.connection) return;

            if (this.isConnecting) return;

            this.isConnecting = true;
            console.log("🚀 Connecting to RabbitMQ...");

            this.connection = await client.connect(this.config.connectionConfig);
            console.log("this.config.connectionConfig :: ", this.config.connectionConfig);

            this.isConnecting = false;
            this.reconnectAttempts = 0;

            console.log("✅ RabbitMQ connection established.");

            if (this.config.publishChannel) {
                await this.ensurePublishConfirmChannelOpen();
            }

            this.connection.on("error", async (error) => {
                console.error("❌ RabbitMQ connection error:", error);
                await this.handleReconnect();
            });

            this.connection.on("close", async () => {
                console.warn("⚠️ RabbitMQ connection closed. Attempting to reconnect...");
                await this.handleReconnect();
            });

        } catch (error) {
            console.error("❌ Error connecting to RabbitMQ:", error);
            await this.handleReconnect();
        }
    }

    private async handleReconnect(): Promise<void> {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("❌ Maximum RabbitMQ reconnection attempts reached. Exiting...");
            throw new Error("Maximum RabbitMQ reconnection attempts reached. Exiting");
        }

        this.isConnecting = false;
        this.connection = undefined!;
        this.publishConfirmChannel = undefined;

        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
        console.log(`⏳ Reconnecting in ${delay / 1000}s...`);

        await new Promise(res => setTimeout(res, delay));
        this.reconnectAttempts++;

        await this.connect(); // Retry connection
    }

    async close(): Promise<void> {
        console.log("⚠️ Closing RabbitMQ connection...");

        if (this.isConnecting) {
            return;
        }

        if (this.publishConfirmChannel) {
            await this.publishConfirmChannel.close();
        }

        if (this.connection) {
            await this.connection.close();
        }

        console.log("✅ RabbitMQ connection closed.");
    }

    private async ensurePublishConfirmChannelOpen(): Promise<void> {
        if (!this.publishConfirmChannel) {
            console.log("📢 Opening ConfirmChannel for publishing...");
            this.publishConfirmChannel = await this.connection.createConfirmChannel();

            this.publishConfirmChannel.on("error", async (error) => {
                console.error("❌ ConfirmChannel error:", error);
                this.publishConfirmChannel = undefined;
                await this.ensurePublishConfirmChannelOpen();
            });

            this.publishConfirmChannel.on("close", async () => {
                console.warn("⚠️ ConfirmChannel closed. Recreating...");
                this.publishConfirmChannel = undefined;
                await this.ensurePublishConfirmChannelOpen();
            });
        }
    }

    async consume(queueName: string, prefetchCount: number,
                  callback: (msg: ConsumeMessage, channel: ConfirmChannel) => Promise<void>,
                  options?: Options.Consume) {
        console.log("🛠️ Creating a new channel for consumer on queue:", queueName);

        const consumerChannel: ConfirmChannel = await this.connection.createConfirmChannel();
        await consumerChannel.prefetch(prefetchCount);

        consumerChannel.on("error", async (error) => {
            console.error(`❌ Consumer channel error on queue ${queueName}:`, error);
            await this.consume(queueName, prefetchCount, callback, options);
        });

        consumerChannel.on("close", async () => {
            console.warn(`⚠️ Consumer channel closed for queue ${queueName}. Reconnecting...`);
            await this.consume(queueName, prefetchCount, callback, options);
        });

        await consumerChannel.consume(queueName, async (msg: ConsumeMessage | null): Promise<void> => {
            if (!msg) return;
            try {
                console.log("##############################")
                console.log("msg received :: ", msg.fields.deliveryTag);
                await callback(msg, consumerChannel);
                console.log("ack msg done :: ", msg.fields.deliveryTag);
                console.log("##############################")
                consumerChannel.ack(msg);
            } catch (e: any) {
                console.error("error :: ", e);
                consumerChannel.nack(msg);
            }
        }, options);
    }

    async sendConfirmedMsgToQueue(queueName: string, payload: any, options?: Options.Publish): Promise<boolean> {
        try {
            await this.ensurePublishConfirmChannelOpen();
            return this._sendConfirmedMsgToQueue(this.publishConfirmChannel!, queueName, payload, options);
        } catch (error) {
            console.error("❌ Error in sendToQueue:", error);
            return false;
        }
    }

    private async _sendConfirmedMsgToQueue(channel: ConfirmChannel, queueName: string, payload: any, options?: Options.Publish): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), options, (err: any) => {
                if (err) {
                    console.error("❌ Error sending to queue:", err);
                    reject(false);
                } else {
                    console.log("✅ Message sent successfully.");
                    resolve(true);
                }
            });
        });
    }

    async sendConfirmedMsgToQueueAndWaitReply(queueName: string, payload: any): Promise<any> {
        try {
            if (!this.publishConfirmChannel) {
                await this.ensurePublishConfirmChannelOpen();
            }

            const tempQueueName = randomUUID();
            console.log("Temp Queue Name:", tempQueueName);

            const consumerChannel = await this.connection.createConfirmChannel();
            await consumerChannel.prefetch(1);

            await consumerChannel.assertQueue(tempQueueName, {
                autoDelete: true,
                exclusive: true,
            });

            await this._sendConfirmedMsgToQueue(this.publishConfirmChannel!, queueName, {...payload}, {
                replyTo: tempQueueName,
                correlationId: randomUUID(),
            });

            const response = await this._consumeOnce(consumerChannel, tempQueueName);
            await consumerChannel.close();

            return response;
        } catch (error) {
            console.error("❌ Error in sendToQueueAndWaitReply:", error);
            return null;
        }
    }

    private async _consumeOnce(consumerChannel: ConfirmChannel, tempQueueName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            consumerChannel.consume(tempQueueName, (msg) => {
                if (msg) {
                    const response = JSON.parse(msg.content.toString());
                    consumerChannel.ack(msg);
                    resolve(response);
                } else {
                    reject(new Error("❌ No response received."));
                }
            }, {noAck: false});

            setTimeout(() => reject(new Error("❌ Timeout waiting for response.")), 10000);
        });
    }

    async publishToExchange(exchangeName: string, routingKey: string, payload: any, options?: Options.Publish): Promise<boolean> {
        try {
            await this.ensurePublishConfirmChannelOpen();

            return new Promise<boolean>((resolve, reject) => {
                this.publishConfirmChannel!.publish(
                    exchangeName,
                    routingKey,
                    Buffer.from(JSON.stringify(payload)),
                    {persistent: true, ...options},
                    (err) => {
                        if (err) {
                            console.error("Error publishing:", err);
                            reject(false);
                        } else {
                            console.log(`✅ Published to "${exchangeName}" with key "${routingKey}"`);
                            resolve(true);
                        }
                    }
                );
            });
        } catch (error) {
            console.error("publishToExchange failed:", error);
            return false;
        }
    }

}

export default class RabbitMQDriver implements IDriver {
    async createConnection(config: RabbitMQConfig): Promise<RabbitMQConnection> {
        console.log(`Creating RabbitMQD connection...`);
        const rabbitMQ = new RabbitMQConnection(config);
        await rabbitMQ.connect();
        return rabbitMQ
    }

    async closeConnection(connection: RabbitMQConnection): Promise<void> {
        console.log("RabbitMQD connection closed.");

        await connection.close()
    }
}