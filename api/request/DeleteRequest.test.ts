import { Request, Response } from "express";
import { RequestContext, DeleteRequest, APIService, RequestAxiosCall, RequestParameterType } from "../../../dist";
import { config } from "../APITestDefinitions";

const service = new APIService(config);
service.init();

class TestRequest extends DeleteRequest {
    constructor() {
        super({
            path: '/test/:method/type',
            params: [{
                context: RequestContext.QUERY,
                properties: [{ name: "value", type: RequestParameterType.STRING }]
            }, {
                context: RequestContext.QUERY,
                properties: [{ name: "option", type: RequestParameterType.STRING }]
            }, {
                context: RequestContext.QUERY,
                properties: [
                    { name: "x", type: RequestParameterType.STRING },
                    { name: "y", type: RequestParameterType.STRING }
                ]
            }, {
                context: RequestContext.PARAMS,
                properties: [{ name: "method", type: RequestParameterType.STRING }]
            }]
        });
    }

    async apply(req: Request, res: Response): Promise<any> {
        const { method } = req.params;
        const { value, option, x, y } = req.query;
        return res.status(200).json({ message: "Success", method: method, type: value, option: option, x: x, y: y });
    }
}

class UnexpectedErrorTestRequest extends DeleteRequest {
    constructor() {
        super({
            path: '/test/error',
            params: []
        });
    }

    async apply(req: Request, res: Response): Promise<any> {
        throw 'Unexpected error';
    }
}

const testUrl = `http://localhost:${config.port}/test/testing/type?value=get`;
const testUrl2 = `http://localhost:${config.port}/test/testing/type?option=1`;
const testUrl3 = `http://localhost:${config.port}/test/testing/type?x=10&y=20`;
const testUrlMissingQuery = `http://localhost:${config.port}/test/testing/type`;
const testUrlUnexpectedError = `http://localhost:${config.port}/test/error`;

describe('testing GET Request', () => {
    beforeAll(async () => {
        await service.run(() => { });
    });
    afterAll(async () => {
        await service.close(() => { })
    });
    test('Refuse request when API Request does not exist', async () => {
        expect.assertions(3);
        return RequestAxiosCall.delete(testUrl).catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(404);
            expect(err.response.statusText).toMatch("Not Found");
        });
    });
    test('Request Query Ok parameter group 1', async () => {
        expect.assertions(6);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.delete(testUrl).then(async (response: any) => {
            expect(response.message).toMatch("Success");
            expect(response.method).toMatch("testing");
            expect(response.type).toMatch("get");
            expect(response.option).toBeUndefined();
            expect(response.x).toBeUndefined();
            expect(response.y).toBeUndefined();
        });
    });
    test('Request Query Ok parameter group 2', async () => {
        expect.assertions(6);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.delete(testUrl2).then(async (response: any) => {
            expect(response.message).toMatch("Success");
            expect(response.method).toMatch("testing");
            expect(response.type).toBeUndefined();
            expect(response.option).toMatch("1");
            expect(response.x).toBeUndefined();
            expect(response.y).toBeUndefined();
        });
    });
    test('Request Query Ok parameter group 3', async () => {
        expect.assertions(6);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.delete(testUrl3).then(async (response: any) => {
            expect(response.message).toMatch("Success");
            expect(response.method).toMatch("testing");
            expect(response.type).toBeUndefined();
            expect(response.option).toBeUndefined();
            expect(response.x).toMatch("10");
            expect(response.y).toMatch("20");
        });
    });
    test('Request Error: missing parameter in query', async () => {
        expect.assertions(5);
        service.addRequest(new TestRequest());
        return RequestAxiosCall.delete(testUrlMissingQuery).catch(async err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(400);
            expect(err.response.statusText).toMatch("Bad Request");
            expect(err.response.data.status).toMatch("Error");
            expect(err.response.data.message).toMatch("Parameters 'x', 'y' were not found in query");
        });
    });
});