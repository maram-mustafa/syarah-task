import {Model, ModelStatic, Sequelize} from "sequelize";
import {readdirSync} from "fs";
import {join, basename} from "path";
import {SequelizeOptions} from "./SequelizeConfig.js";

export default class SequelizeWrapper {
    protected name: string;
    protected sequelizeConnection: Sequelize;
    protected config: SequelizeOptions;
    protected modelsRegistry: Map<any, any> = new Map();

    constructor(name: string, sequelize: Sequelize, config: SequelizeOptions) {
        console.log("creating a new sequelize wrapper for connection name :: " , name);
        this.name = name;
        this.sequelizeConnection = sequelize;
        this.config = config;
    }

    async setModels(connectionConfig: SequelizeOptions): Promise<void> {
        const modelPath = connectionConfig.modelsPath;

        if (modelPath) {
            const files = readdirSync(modelPath).filter(file => file.endsWith('.js'));

            // Initialize models
            for (const file of files) {
                const modelImport = await import(join(modelPath, file));
                const modelClass = modelImport.default as any;

                if (modelClass && typeof modelClass.initialize === 'function') {
                    const model = modelClass.initialize(this);
                    const modelName = model.name || basename(file, '.js');

                    console.log("modelName :: ( init model )", modelName);
                    console.log("modelClass :: ", modelClass);

                    this.modelsRegistry.set(modelClass, model);
                }
            }

            console.log("after init modelsRegistry :: ", this.modelsRegistry);


            // Setup relations
            for (const file of files) {
                const modelImport = await import(join(modelPath, file));
                const modelClass = modelImport.default as any;

                if (modelClass && typeof modelClass.relations === 'function') {
                    const modelName = basename(file, '.js');
                    console.log("modelName ( relations load ) :: ", modelName);
                    modelClass.relations(this);
                }
            }

            console.log("after loading relations modelsRegistry :: ", this.modelsRegistry);
        }
    }

    getConnection(): Sequelize {
        return this.sequelizeConnection;
    }

    getModel<T extends Model>(modelClass: ModelStatic<T>): ModelStatic<T>{
        console.log("modelClass :: ", modelClass);

        const model = this.modelsRegistry.get(modelClass);

        if (!model) {
            throw new Error(`Model "${modelClass.name}" not found`);
        }

        return model as ModelStatic<T>;
    }
}
