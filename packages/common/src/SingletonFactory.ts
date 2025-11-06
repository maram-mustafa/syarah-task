export default class SingletonFactory<T> {
    private instance: T | null = null;
    private pending: Promise<T> | null = null;

    constructor(private creator: () => Promise<T>) {}

    async getInstance(): Promise<T> {
        if (this.instance) return this.instance;
        if (this.pending) return this.pending;

        this.pending = this.creator().then((created) => {
            this.instance = created;
            this.pending = null;
            return created;
        });

        return this.pending;
    }

    reset(): void {
        this.instance = null;
        this.pending = null;
    }
}
