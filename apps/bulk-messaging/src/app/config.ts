import process from "node:process";
import {ConnectionManagerConfig} from "@my/common";
import {SequelizeManagerConfig} from "@my/sequelize";
import {MessagingManagerConfig} from "@my/messaging"
import {join} from "node:path";

export const connectionManagerConfig: ConnectionManagerConfig = {
    redisCon: {
        driver: 'redis',
        config: {
            redisLink: process.env.REDIS_LINK ?? '',
            config: {
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || '',
            }
        },
    },
    rabbitmqCon: {
        driver: 'rabbitmq',
        config: {
            publishChannel: true,
            connectionConfig: {
                hostname: process.env.RABBITMQ_HOST || '127.0.0.1',
                port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
                username: process.env.RABBITMQ_USER || 'user',
                password: process.env.RABBITMQ_PASSWORD || 'password',
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
                host: process.env.DB_HOST || "127.0.0.1",
                port: parseInt(process.env.DB_PORT || "3306", 10),
                username: process.env.DB_USERNAME || "maram",
                password: process.env.DB_PASSWORD || "maram1234",
                database: process.env.DB_NAME || "central_hub",
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

export const messagingManagerConfig: MessagingManagerConfig = {
    default: "emailChannel",
    channels: {
        emailChannel: {
            type: 'email',
            config: {
                provider: (process.env.EMAIL_PROVIDER || 'sendgrid') as 'sendgrid',
                apiKey: process.env.EMAIL_API_KEY || '',
                fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
                fromName: process.env.EMAIL_FROM_NAME || 'Syarah Platform'
            }
        },
        smsChannel: {
            type: 'sms',
            config: {
                provider: (process.env.SMS_PROVIDER || 'twilio') as 'twilio',
                accountSid: process.env.SMS_ACCOUNT_SID || '',
                authToken: process.env.SMS_AUTH_TOKEN || '',
                senderId: process.env.SMS_SENDER_ID || ''
            }
        }
    }
};