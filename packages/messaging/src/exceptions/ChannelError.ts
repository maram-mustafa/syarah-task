export default abstract class ChannelError extends Error {
    constructor(msg: any) {
        super(msg);
    }
}