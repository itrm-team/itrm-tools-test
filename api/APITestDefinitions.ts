import { APIServiceConfig, ExpressStandardConfiguration } from "../../dist";

export const config: APIServiceConfig = {
    name: 'test',
    port: 8150,
    express: new ExpressStandardConfiguration()
};