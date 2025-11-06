import process from "node:process";
import { ConnectionManagerConfig } from "@my/common";
import { SequelizeManagerConfig } from "@my/sequelize";
import { join } from "node:path";
import { IndexClientConfig } from "@my/elasticsearch";

export const connectionManagerConfig: ConnectionManagerConfig = {
    rabbitmqCon: {
        driver: "rabbitmq",
        config: {
            publishChannel: true,
            consumeChannel: true,
            connectionConfig: {
                hostname: process.env.RABBITMQ_HOST || "127.0.0.1",
                port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
                username: process.env.RABBITMQ_USER || "user",
                password: process.env.RABBITMQ_PASSWORD || "password",
            },
        },
    },
};

export const sequelizeManagerConfig: SequelizeManagerConfig = {
    default: process.env.DEFAULT_SEQUELIZE_CONNECTION || "default",
    connections: {
        default: {
            modelsPath: join(import.meta.dirname, "..", "models"),
            options: {
                dialect: "mysql",
                dialectOptions: {
                    connectTimeout: 10000,
                },
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || "3306", 10),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                logging: process.env.DB_LOGGING === "true",
                pool: {
                    max: parseInt(process.env.SEQUELIZE_POOL_MAX || "10", 10),
                    min: parseInt(process.env.SEQUELIZE_POOL_MIN || "0", 10),
                    idle: parseInt(process.env.SEQUELIZE_POOL_IDLE || "10000", 10),
                },
            },

        },
    },
};

export const elasticsearchManagerConfig: Record<string, IndexClientConfig> = {
    default: {
        type: "elasticsearch",
        config: {
            node: process.env.ES_NODE || "http://localhost:9200",
            auth: process.env.ES_USERNAME && process.env.ES_PASSWORD
                ? {
                      username: process.env.ES_USERNAME,
                      password: process.env.ES_PASSWORD,
                  }
                : undefined,
            tls: process.env.ES_TLS_ENABLED === "true"
                ? {
                      rejectUnauthorized: process.env.ES_TLS_REJECT_UNAUTHORIZED !== "false",
                  }
                : undefined,
            requestTimeout: parseInt(process.env.ES_REQUEST_TIMEOUT || "30000", 10),
            maxRetries: parseInt(process.env.ES_MAX_RETRIES || "3", 10),
            compression: process.env.ES_COMPRESSION === "true",
        },
    },
};