import { Container } from "inversify";

export default abstract class ServiceProvider {
    protected container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    /**
     * Register services or bindings in the container.
     */
    abstract register(): void;

    /**
     * Boot additional logic after all providers are registered (optional).
     */
    boot?(): void;
}