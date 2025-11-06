import {Options} from "sequelize";

export type SequelizeOptions = {
    modelsPath?: string,
    options: Options
}

export default interface SequelizeManagerConfig {
    default: string;
    connections: {
        [key: string]: SequelizeOptions;
    };
}