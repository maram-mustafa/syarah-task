import {ConnectionManager, ServiceProvider, TYPES} from "@my/common";
import {SequelizeManager} from "@my/sequelize";
import {
    connectionManagerConfig,
    sequelizeManagerConfig,
    elasticsearchManagerConfig
} from "./config.js";
import {ElasticsearchManager} from "@my/elasticsearch";
import {ProductRepository} from "../repositories/ProductRepository.js";
import {IndexSyncService} from "../services/IndexSyncService.js";
import {ProductService} from "../services/ProductService.js";

export default class AppServiceProvider extends ServiceProvider {
    register(): void {
        console.log("register AppServiceProvider is called...")
        this.container.bind(TYPES.ConnectionManagerConfig).toConstantValue(connectionManagerConfig);
        this.container.bind(TYPES.ConnectionManager).toDynamicValue(() => {
            return new ConnectionManager(this.container);
        }).inSingletonScope();
        this.container.bind(TYPES.SequelizeManagerConfig).toConstantValue(sequelizeManagerConfig);
        this.container.bind(TYPES.SequelizeManager).toDynamicValue(() => {
            return new SequelizeManager(sequelizeManagerConfig);
        }).inSingletonScope();
        this.container.bind(TYPES.ElasticsearchManagerConfig).toConstantValue(elasticsearchManagerConfig);
        this.container.bind(TYPES.ElasticsearchManager).toDynamicValue(() => {
            return new ElasticsearchManager(this.container, elasticsearchManagerConfig);
        }).inSingletonScope();
        this.container.bind<ProductRepository>("ProductRepository").to(ProductRepository).inSingletonScope();
        this.container.bind<IndexSyncService>("IndexSyncService").to(IndexSyncService).inSingletonScope();
        this.container.bind<ProductService>("ProductService").to(ProductService).inSingletonScope();

        console.log("register AppServiceProvider is done ..");
    }
}