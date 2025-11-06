import {IDriver} from "../index.js";
import {Redis, RedisOptions} from "ioredis";
export type RedisConConfig = { redisLink?: string, config: RedisOptions };

export default class RedisDriver implements IDriver {
    async createConnection(config: RedisConConfig): Promise<any> {
        console.log(`Creating Redis connection...`);
        if (config.redisLink) {
            console.log(`Redis link: ${config.redisLink}`);
            return new Redis(config.redisLink);
        }
        console.log("redis config :: ", config.config);
        return new Redis(config.config);
    }

    async closeConnection(connection: Redis): Promise<any> {
        console.log("Redis connection closed.");
        return connection.disconnect();
    }
}