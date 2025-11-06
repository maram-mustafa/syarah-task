import express, {Application, Router, urlencoded} from 'express';
import cors from 'cors';

export interface IRouteConfig {
    path: string;
    router: Router;
}

export default class ExpressApp {
    private app: Application;

    constructor() {
        this.app = express();
    }

    public init() {
        this.configureMiddlewares();
        console.log('Express app initialized.');
    }

    private configureMiddlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(urlencoded({extended: true}));
    }

    public registerRoutes(routesConfigs: IRouteConfig[]) {
        console.log("routesConfigs :: ", routesConfigs);
        routesConfigs.forEach(({path, router}) => {
            console.log("path, router::", path, router);
            console.log(`Registering route: ${path}`);
            this.registerRoute(path, router);
        });
    }

    private registerRoute(routePath: string, router: Router) {
        this.app.use(routePath, router);
    }

    public listen(port: number) {
        if (!port) {
            console.error("Missing PORT. set EXPRESS_APP_PORT.");
            process.exit(1);
        }

        this.app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    }
}