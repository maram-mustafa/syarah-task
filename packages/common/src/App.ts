import { Container, injectable } from "inversify";
import ServiceProvider from "./ServiceProvider.js";

@injectable()
export default class App {
    protected container: Container;
    protected providers: ServiceProvider[] = [];

    constructor() {
        this.container = new Container({ autoBindInjectable: true });
        this.container.bind('app').toConstantValue(this.container);
    }

    public registerProviders(providerClasses: Array<new (container: Container) => ServiceProvider>): void {
        this.providers = providerClasses.map((ProviderClass) => {
            const provider = new ProviderClass(this.container);
            provider.register();
            return provider;
        });

        this.providers.forEach((provider) => {
            if (provider.boot) {
                provider.boot();
            }
        });
    }

    async run(callback: (app: App) => Promise<void>) {
        console.log("App is running. Press CTRL+C to exit.");

        await callback(this);
    }

    async job(callback: (app: App) => Promise<void>) {
        console.log("Job is running. Press CTRL+C to exit.");

        await callback(this);

        process.exit(0);
    }

    public get<T>(name: string | symbol): T {
        return this.container.get<T>(name);
    }
}
