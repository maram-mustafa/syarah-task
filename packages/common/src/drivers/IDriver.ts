export default interface IDriver {
    createConnection(config: any): Promise<any>;
    closeConnection(connection: any): Promise<any>;
}