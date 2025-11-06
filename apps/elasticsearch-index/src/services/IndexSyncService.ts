import {inject, injectable} from "inversify";
import {Client} from "@elastic/elasticsearch";
import {ElasticsearchManager} from "@my/elasticsearch";
import {ProductRepository} from "../repositories/ProductRepository.js";
import Product from "../models/Product.js";
import {TYPES} from "@my/common";

export type SyncOperation = "index" | "update" | "delete";

export interface SyncEvent {
    operation: SyncOperation;
    productId: number;
    data?: any;
}

export interface SyncStats {
    total: number;
    indexed: number;
    updated: number;
    deleted: number;
    failed: number;
    startTime: Date;
    endTime?: Date;
    duration?: number;
}

@injectable()
export class IndexSyncService {
    private esClient: Client | null = null;
    private readonly indexName = process.env.ES_PRODUCTS_INDEX || "products_index";
    private readonly batchSize = parseInt(process.env.ES_BATCH_SIZE || "1000");

    constructor(
        @inject(TYPES.ElasticsearchManager) private elasticsearchManager: ElasticsearchManager,
        @inject("ProductRepository") private productRepository: ProductRepository
    ) {}

    private productToElasticsearchDocument(product: Product): Record<string, any> {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            sku: product.sku,
            price: parseFloat(product.price.toString()),
            category: product.category,
            stock_quantity: product.stock_quantity,
            status: product.status,
            tags: product.tags ? JSON.parse(product.tags) : [],
            created_at: product.created_at,
            updated_at: product.updated_at,
        };
    }

    private async getClient(): Promise<Client> {
        if (!this.esClient) {
            this.esClient = await this.elasticsearchManager.client();
        }
        return this.esClient!;
    }

    async createOrUpdateIndex(): Promise<void> {
        const client = await this.getClient();

        const indexExists = await client.indices.exists({
            index: this.indexName,
        });

        if (!indexExists) {
            await client.indices.create({
                index: this.indexName,
                body: {
                    settings: {
                        number_of_shards: 2,
                        number_of_replicas: 1,
                        analysis: {
                            analyzer: {
                                custom_text_analyzer: {
                                    type: "custom",
                                    tokenizer: "standard",
                                    filter: ["lowercase", "asciifolding"],
                                },
                            },
                        },
                    },
                    mappings: {
                        properties: {
                            id: {type: "long"},
                            name: {
                                type: "text",
                                analyzer: "custom_text_analyzer",
                                fields: {
                                    keyword: {type: "keyword"},
                                },
                            },
                            description: {
                                type: "text",
                                analyzer: "custom_text_analyzer",
                            },
                            sku: {type: "keyword"},
                            price: {type: "scaled_float", scaling_factor: 100},
                            category: {
                                type: "keyword",
                                fields: {
                                    text: {type: "text"},
                                },
                            },
                            stock_quantity: {type: "integer"},
                            status: {type: "keyword"},
                            tags: {type: "keyword"},
                            created_at: {type: "date"},
                            updated_at: {type: "date"},
                        },
                    },
                },
            });

            console.log(`Elasticsearch index created: ${this.indexName}`);
        } else {
            console.log(`Elasticsearch index already exists: ${this.indexName}`);
        }
    }

    async performInitialSync(): Promise<SyncStats> {
        console.log("Starting initial sync from MySQL to Elasticsearch...");

        const stats: SyncStats = {
            total: 0,
            indexed: 0,
            updated: 0,
            deleted: 0,
            failed: 0,
            startTime: new Date(),
        };

        try {
            await this.createOrUpdateIndex();

            const totalProducts = await this.productRepository.count();
            stats.total = totalProducts;

            console.log(`Total products to sync: ${totalProducts}`);

            if (totalProducts === 0) {
                console.log("No products found. Skipping sync.");
                stats.endTime = new Date();
                stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
                return stats;
            }

            const totalBatches = Math.ceil(totalProducts / this.batchSize);
            let offset = 0;

            for (let batch = 1; batch <= totalBatches; batch++) {
                console.log(`Processing batch ${batch}/${totalBatches}...`);

                const products = await this.productRepository.findBatch(
                    this.batchSize,
                    offset
                );

                if (products.length === 0) {
                    break;
                }

                const result = await this.bulkIndexProducts(products);
                stats.indexed += result.success;
                stats.failed += result.failed;

                offset += this.batchSize;

                const progress = Math.round((offset / totalProducts) * 100);
                console.log(`Progress: ${progress}% (${offset}/${totalProducts})`);
            }

            stats.endTime = new Date();
            stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

            console.log("\n✓ Initial sync completed!");
            console.log(`  Total: ${stats.total}`);
            console.log(`  Indexed: ${stats.indexed}`);
            console.log(`  Failed: ${stats.failed}`);
            console.log(`  Duration: ${(stats.duration / 1000).toFixed(2)}s`);

            return stats;
        } catch (error) {
            console.error("✗ Initial sync failed:", error);
            throw error;
        }
    }

    private async bulkIndexProducts(products: Product[]): Promise<{ success: number; failed: number }> {
        const client = await this.getClient();

        const body = products.flatMap((product) => [
            {index: {_index: this.indexName, _id: product.id.toString()}},
            this.productToElasticsearchDocument(product),
        ]);

        try {
            const response = await client.bulk({body});

            let success = 0;
            let failed = 0;

            if (response.errors) {
                response.items.forEach((item: any) => {
                    if (item.index?.error) {
                        failed++;
                        console.error(
                            `Failed to index product ${item.index._id}:`,
                            item.index.error
                        );
                    } else {
                        success++;
                    }
                });
            } else {
                success = products.length;
            }

            return {success, failed};
        } catch (error) {
            console.error("Bulk indexing error:", error);
            return {success: 0, failed: products.length};
        }
    }

    async handleSyncEvent(event: SyncEvent): Promise<void> {
        console.log(
            `Processing sync event: ${event.operation} for product ${event.productId}`
        );

        try {
            switch (event.operation) {
                case "index":
                case "update":
                    await this.indexProduct(event.productId);
                    break;

                case "delete":
                    await this.deleteProduct(event.productId);
                    break;

                default:
                    console.warn(`Unknown operation: ${event.operation}`);
            }
        } catch (error) {
            console.error(`Failed to handle sync event:`, error);
            throw error;
        }
    }

    async indexProduct(productId: number): Promise<void> {
        const product = await this.productRepository.findById(productId);

        if (!product) {
            console.warn(`Product ${productId} not found in MySQL. Skipping.`);
            return;
        }

        const client = await this.getClient();

        await client.index({
            index: this.indexName,
            id: product.id.toString(),
            body: this.productToElasticsearchDocument(product),
        });

        console.log(`Product ${productId} indexed to Elasticsearch`);
    }

    async deleteProduct(productId: number): Promise<void> {
        const client = await this.getClient();

        try {
            await client.delete({
                index: this.indexName,
                id: productId.toString(),
            });

            console.log(`Product ${productId} deleted from Elasticsearch`);
        } catch (error: any) {
            if (error.meta?.statusCode === 404) {
                console.warn(`Product ${productId} not found in Elasticsearch`);
            } else {
                throw error;
            }
        }
    }
}