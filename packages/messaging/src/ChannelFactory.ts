import {Container} from "inversify";
import {IMessageChannel} from "./channels/IMessageChannel.js";
import {ChannelStoreConfig} from "./MessagingManager.js";

export type MessageChannelFactory = (
    container: Container,
    config: ChannelStoreConfig
) => Promise<IMessageChannel>;

export default class ChannelFactory {
    protected container: Container;
    protected channels: Map<string, MessageChannelFactory> = new Map();

    constructor(container: Container) {
        this.container = container;
    }

    registerChannel(type: string, factory: MessageChannelFactory) {
        if (this.channels.has(type)) {
            throw new Error(`Channel "${type}" already registered...`);
        }
        this.channels.set(type, factory);
    }

    async createChannel(config: ChannelStoreConfig): Promise<IMessageChannel> {
        if (!config?.type) {
            throw new Error(`channel type is missing in configuration...`);
        }

        const factory = this.channels.get(config.type);
        if (!factory) {
            throw new Error(`channelFactory "${config.type}" is not registered...`);
        }

        return await factory(this.container, config);
    }
}