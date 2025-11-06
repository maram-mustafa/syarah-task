import {Container} from "inversify";
import {Client} from "@elastic/elasticsearch";
import {IndexClientConfig} from "./ElasticsearchManager.js";

export type IndexClientFactory = (container: Container, config: IndexClientConfig) => Promise<Client>;

export default class IndexFactory {
    protected clients: Map<string, IndexClientFactory> = new Map();
    protected container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    registerClient(type: string, factory: IndexClientFactory): void {
        this.clients.set(type, factory);
    }

    async createClient(config: IndexClientConfig): Promise<Client> {
        const factoryType = config.type || "elasticsearch";

        const factory = this.clients.get(factoryType);

        if (!factory) {
            throw new Error(
                `Elasticsearch client factory not found for type: ${factoryType}. ` +
                `Available types: ${Array.from(this.clients.keys()).join(", ")}`
            );
        }

        return await factory(this.container, config);
    }
}
