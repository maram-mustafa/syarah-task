import {injectable, Container} from "inversify";
import {Client, ClientOptions} from "@elastic/elasticsearch";
import IndexFactory, {IndexClientFactory} from "./IndexFactory.js";

export type IndexClientConfig = {
    connectionName: string;
    type?: never;
    config?: never;
} | {
    type: string;
    connectionName?: never;
    config: ClientOptions;
};

@injectable()
export default class ElasticsearchManager {
    protected clients: Map<string, Client> = new Map();
    protected factory: IndexFactory;
    protected container: Container;
    protected config: Record<string, IndexClientConfig>;

    constructor(container: Container, config: Record<string, IndexClientConfig>) {
        this.container = container;
        this.config = config;
        this.factory = new IndexFactory(container);

        // Register default Elasticsearch client factory
        this.factory.registerClient("elasticsearch", this.createDefaultClient.bind(this));
    }

    async client(clientName: string = "default"): Promise<Client> {
        if (this.clients.has(clientName)) {
            return this.clients.get(clientName)!;
        }

        const clientConfig = this.config[clientName];
        if (!clientConfig) {
            throw new Error(`Elasticsearch client configuration not found: ${clientName}`);
        }

        const client = await this.factory.createClient(clientConfig);
        this.clients.set(clientName, client);

        return client;
    }

    setClient(typeName: string, factory: IndexClientFactory): void {
        this.factory.registerClient(typeName, factory);
    }

    protected async createDefaultClient(
        container: Container,
        config: IndexClientConfig
    ): Promise<Client> {
        const clientOptions = config.config as ClientOptions;

        const client = new Client(clientOptions);

        // Test connection
        try {
            await client.ping();
            console.log(`✓ Elasticsearch client connected: ${clientOptions.node || 'localhost'}`);
        } catch (error) {
            console.error(`✗ Failed to connect to Elasticsearch:`, error);
            throw error;
        }

        return client;
    }

    async closeAll(): Promise<void> {
        const closePromises = Array.from(this.clients.values()).map(client =>
            client.close()
        );

        await Promise.all(closePromises);
        this.clients.clear();

        console.log('✓ All Elasticsearch connections closed');
    }
}
