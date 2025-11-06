import {ConnectionManager, Redis, ServiceProvider, TYPES} from "@my/common";
import {Container} from "inversify";
import {SequelizeManager} from "@my/sequelize";
import {MessagingManager, SendGridEmailChannel, EmailChannelConfig} from "@my/messaging";
import {connectionManagerConfig, sequelizeManagerConfig, messagingManagerConfig} from "./config.js";
import {CampaignRepository} from "../repositories/CampaignRepository.js";
import {CampaignTargetRepository} from "../repositories/CampaignTargetRepository.js";
import {OutboxRepository} from "../repositories/OutboxRepository.js";
import {CampaignService} from "../services/CampaignService.js";
import {NotificationService} from "../services/NotificationService.js";
import {OutboxPollerService} from "../services/OutboxPollerService.js";

export default class AppServiceProvider extends ServiceProvider {
    register(): void {
        console.log("register AppServiceProvider is called ..")
        this.container.bind(TYPES.ConnectionManagerConfig).toConstantValue(connectionManagerConfig);
        this.container.bind(TYPES.ConnectionManager).toDynamicValue(() => {
            return new ConnectionManager(this.container);
        }).inSingletonScope();

        this.container.bind(TYPES.SequelizeManagerConfig).toConstantValue(sequelizeManagerConfig);
        this.container.bind(TYPES.SequelizeManager).toDynamicValue(() => {
            return new SequelizeManager(sequelizeManagerConfig);
        }).inSingletonScope();
        this.container.bind(TYPES.MessagingManagerConfig).toConstantValue(messagingManagerConfig);
        this.container.bind(TYPES.MessagingManager).toDynamicValue(() => {
            const messagingManager = new MessagingManager(this.container);
            messagingManager.setChannel("email", async (container: Container, channelConfig) => {
                return new SendGridEmailChannel(channelConfig.config as EmailChannelConfig);
            });
            return messagingManager;
        }).inSingletonScope();
        this.container.bind<CampaignRepository>("CampaignRepository").to(CampaignRepository).inSingletonScope();
        this.container.bind<CampaignTargetRepository>("CampaignTargetRepository").to(CampaignTargetRepository).inSingletonScope();
        this.container.bind<OutboxRepository>("OutboxRepository").to(OutboxRepository).inSingletonScope();
        this.container.bind<CampaignService>("CampaignService").to(CampaignService).inSingletonScope();
        this.container.bind<NotificationService>("NotificationService").to(NotificationService).inSingletonScope();
        this.container.bind<OutboxPollerService>("OutboxPollerService").to(OutboxPollerService).inSingletonScope();

        console.log("register AppServiceProvider is done ..");
    }
}