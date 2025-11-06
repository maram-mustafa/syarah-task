import {Container, injectable} from "inversify";
import ChannelFactory, {MessageChannelFactory} from "./ChannelFactory.js";
import {IMessageChannel} from "./channels/IMessageChannel.js";
import {TYPES} from "@my/common";
import CriticalErrorChannel from "./exceptions/CriticalErrorChannel.js";

export type ChannelStoreConfig =
    {
        connectionName: string;
        type?: never;
        config?: any
    } | {
    type: string;
    connectionName?: never;
    config: any
};

export interface MessagingManagerConfig {
    default: string;
    channels: {
        [channels: string]: ChannelStoreConfig;
    }
}

@injectable()
export default class MessagingManager {
    protected container: Container;
    protected factory: ChannelFactory;
    protected channels: Map<string, IMessageChannel> = new Map();
    protected configs: MessagingManagerConfig;

    constructor(container: Container) {
        this.container = container;
        this.factory = new ChannelFactory(container);
        this.configs = container.get<MessagingManagerConfig>(TYPES.MessagingManagerConfig);
    }

    async channel(channelName?: string): Promise<IMessageChannel> {
        channelName = channelName ?? this.configs.default;

        if (this.channels.has(channelName)) {
            return this.channels.get(channelName)!;
        }

        const config = this.configs.channels[channelName];

        if (!config) {
            throw new CriticalErrorChannel(`channel configuration for "${channelName}" not found.`);
        }

        const channel = await this.factory.createChannel(config);
        this.channels.set(channelName, channel);

        return channel;
    }

    setChannel(channelName: string, factory: MessageChannelFactory): void {
        this.factory.registerChannel(channelName, factory);
    }
}