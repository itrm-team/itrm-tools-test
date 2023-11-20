import { Request, Response } from "express";
import { APIService, CheckablePostRequest, RequestContext, RequestAxiosCall, RequestParameterType } from "../../../dist";
import { config } from "../APITestDefinitions";
import { check, unexpectedErrorCheck } from "./CheckDefinitions";

const service = new APIService(config);
service.init();

export class TestRequest extends CheckablePostRequest {
    constructor() {
        super({
            path: "/check",
            params: [{
                context: RequestContext.QUERY,
                properties: [{ name: "key", type: RequestParameterType.STRING }]
            }]
        });
    }

    public getCheckConfiguration() {
        return {
            key: 'valid'
        };
    }

    public async apply(req: Request, res: Response): Promise<any> {
        return res.status(200).json({ message: 'Success' });
    }
}

export class InvalidCheckConfigurationTestRequest extends CheckablePostRequest {
    constructor() {
        super({
            path: "/invalid-check",
            params: [{
                context: RequestContext.QUERY,
                properties: [{ name: "key", type: RequestParameterType.STRING }]
            }]
        });
    }

    public getCheckConfiguration() { // invalid configuration
        return {
            password: 'valid'
        };
    }

    public async apply(req: Request, res: Response): Promise<any> {
        return res.status(200).json({ message: 'Success' });
    }
}

const validKeyUrl = `http://localhost:${config.port}/check?key=valid`;
const invalidKeyUrl = `http://localhost:${config.port}/check?key=invalid`;
const invalidUnknownKeyUrl = `http://localhost:${config.port}/check?key=unknown`;

describe('testing Checkable POST Request', () => {
    let request = new TestRequest();
    beforeAll(async () => {
        await service.run(() => { });
    });
    afterAll(async () => {
        await service.close(() => { })
    });
    test('Refuse request when API Request does not exist', async () => {
        expect.assertions(3);
        return RequestAxiosCall.post(validKeyUrl, {}).catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(404);
            expect(err.response.statusText).toMatch("Not Found");
        });
    });
    test('Checking valid', async () => {
        expect.assertions(1);
        request.addCheck(check);
        await service.addRequest(request);
        return RequestAxiosCall.post(validKeyUrl, {}).then(async (response: any) => {
            expect(response.message).toMatch("Success");
        });
    });
    test('Checking invalid', async () => {
        expect.assertions(4);
        return RequestAxiosCall.post(invalidKeyUrl, {}).catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(401);
            expect(err.response.statusText).toMatch("Unauthorized");
            expect(err.response.data.message).toMatch("key does not match");
        });
    });
    test('Checking invalid with no unauthorization reason', async () => {
        expect.assertions(4);
        return RequestAxiosCall.post(invalidUnknownKeyUrl, {}).catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(401);
            expect(err.response.statusText).toMatch("Unauthorized");
            expect(err.response.data.message).toMatch("Unknown reason");
        });
    });
});