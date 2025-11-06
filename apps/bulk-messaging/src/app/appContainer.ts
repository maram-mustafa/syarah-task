import {App} from "@my/common";
import AppServiceProvider from "./AppServiceProvider.js";

export const appContainer = new App();

appContainer.registerProviders([AppServiceProvider]);