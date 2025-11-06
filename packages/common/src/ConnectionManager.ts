import IDriver from "./drivers/IDriver.js";
import RedisDriver from "./drivers/RedisDriver.js";
import RabbitMQDriver from "./drivers/RabbitMQDriver.js";
import {Container, injectable} from "inversify";
import {TYPES} from "./types.js";
import SingletonFactory from "./SingletonFactory.js";

export type ConnectionConfig = {
    driver: string;
    config: any;
};

export type ConnectionManagerConfig = {
    [key: string]: ConnectionConfig;
};

@injectable()
export default class ConnectionManager {
    protected container: Container;
    protected drivers: Map<string, IDriver> = new Map();
    protected connectionManagerConfig: ConnectionManagerConfig;
    protected connectionSingletonFactories: Map<string, SingletonFactory<any>> = new Map();

    constructor(container: Container) {
        this.container = container;
        this.connectionManagerConfig = this.container.get<ConnectionManagerConfig>(TYPES.ConnectionManagerConfig);
        this.registerDriver('redis', new RedisDriver());
        this.registerDriver('rabbitmq', new RabbitMQDriver());
    }

    registerDriver(name: string, driver: IDriver) {
        this.drivers.set(name, driver);
    }

    async resolve<T = any>(connectionName: string): Promise<T> {
        let factory = this.connectionSingletonFactories.get(connectionName);

        if (!factory) {
            console.log("Creating new SingletonFactory for", connectionName);

            const connectionConfig = this.connectionManagerConfig[connectionName];

            if (!connectionConfig) {
                throw new Error(`Connection configuration for ${connectionName} not found.`);
            }

            const { driver, config } = connectionConfig;
            const driverInstance = this.drivers.get(driver);

            if (!driverInstance) {
                throw new Error(`Driver ${driver} is not registered.`);
            }

            factory = new SingletonFactory(() => driverInstance.createConnection(config));

            this.connectionSingletonFactories.set(connectionName, factory);
        }

        return factory.getInstance();
    }

    getConnectionConfig(connectionName: string): ConnectionConfig {
        console.log("getConnectionConfig", connectionName);
        return this.connectionManagerConfig[connectionName];
    }

    async close() {
        console.log("🔌 Closing all connections...");
        for (const connectionName of this.connectionSingletonFactories.keys()) {
            await this.closeConnection(connectionName);
        }
    }

    protected async closeConnection(connectionName: string) {
        console.log("🛑 Closing connection:", connectionName);

        const connectionConfig = this.getConnectionConfig(connectionName);
        const { driver } = connectionConfig;

        const driverInstance = this.drivers.get(driver);
        if (!driverInstance) {
            throw new Error(`Driver ${driver} is not registered.`);
        }

        const factory = this.connectionSingletonFactories.get(connectionName);
        if (!factory) return;

        const connection = await factory.getInstance();
        await driverInstance.closeConnection(connection);

        factory.reset();
        this.connectionSingletonFactories.delete(connectionName);
    }
}