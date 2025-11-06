import ExpressApp from "./app/ExpressApp.js";
import productsRoutes from "./modules/products/products.routes.js";

const expressApp = new ExpressApp();
expressApp.init();

expressApp.registerRoutes([
    {path: '/api/v1', router: productsRoutes},
]);

expressApp.listen(Number(process.env.EXPRESS_APP_PORT) || 3000);