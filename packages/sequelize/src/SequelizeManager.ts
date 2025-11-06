import {SingletonFactory, TYPES} from "@my/common";
import {Sequelize} from "sequelize";
import SequelizeWrapper from "./SequelizeWrapper.js";
import SequelizeManagerConfig, {SequelizeOptions} from "./SequelizeConfig.js";
import {inject} from "inversify";

export default class SequelizeManager {
    private factories = new Map<string, SingletonFactory<SequelizeWrapper>>();
    private sequelizeManagerConfig: SequelizeManagerConfig;

    constructor(@inject(TYPES.SequelizeManagerConfig) sequelizeManagerConfig: SequelizeManagerConfig) {
        console.log("sequelizeManagerConfig  ::", sequelizeManagerConfig);
        this.sequelizeManagerConfig = sequelizeManagerConfig;
    }

    async connection(connectionName?: string): Promise<SequelizeWrapper> {
        console.log("trying to resolve connection :: ", connectionName);

        connectionName = connectionName ?? this.sequelizeManagerConfig.default;

        const config = this.sequelizeManagerConfig.connections?.[connectionName];

        if (!config) {
            throw new Error(`Connection config for "${connectionName}" not found.`);
        }

        return this.addConnection(connectionName, config);
    }

    async addConnection(connectionName: string, config: SequelizeOptions): Promise<SequelizeWrapper> {
        if (!config?.options) {
            throw new Error(`Connection "${connectionName}" is not configured properly.`);
        }

        let factory = this.factories.get(connectionName);

        if (!factory) {
            factory = new SingletonFactory<SequelizeWrapper>(async () => {
                console.log(`Creating a new SequelizeWrapper for connection name :: ${connectionName}`);
                const sequelizeConnection = new Sequelize(config.options);
                const wrapper = new SequelizeWrapper(connectionName, sequelizeConnection, config);
                await wrapper.setModels(config);
                return wrapper;
            });

            this.factories.set(connectionName, factory);
        }

        return await factory.getInstance();
    }

    resetConnection(connectionName: string): void {
        this.factories.get(connectionName)?.reset();
    }

    resetAll(): void {
        for (const factory of this.factories.values()) {
            factory.reset();
        }
    }
}
