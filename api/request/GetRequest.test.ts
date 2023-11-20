import { APIService, GetRequest, RequestContext, RequestAxiosCall, RequestParameterType } from "../../../dist";
import { APIRequestBuilder } from "../../../dist/api/APIRequestBuilder";
import { Request, Response } from "express";
import { config } from "../APITestDefinitions";

const service = new APIService(config);
service.init();

class TestRequest extends GetRequest {
    constructor(builder: APIRequestBuilder) {
        super(builder.buildApiRequestConfig("/test/:method/type"));
    }

    async apply(req: Request, res: Response): Promise<any> {
        const { method } = req.params;
        const { value, option, x, y } = req.query;
        return res.status(200).json({ message: "Success", method: method, type: value, option: option, x: x, y: y });
    }
}

export class TestRequestBuilder extends APIRequestBuilder {
    constructor() {
        super();
    }

    public buildParams() {
        return [{
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
        }, {
            context: RequestContext.PARAMS,
            properties: [{ name: "success", type: RequestParameterType.BOOLEAN }]
        }];
    }

    public buildDocDetails() {
        return {
            description: "Get Request",
            samples: [{
                status: 200,
                input: { x: 5, y: 2 },
                output: {
                    message: "hola cómo estás"
                }
            }]
        }
    }

    public buildApiRequestConfig(path: string) {
        return {
            path: path,
            params: this.buildParams(),
            details: this.buildDocDetails()
        }
    }
}

const testRequest = new TestRequest(new TestRequestBuilder());

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
        return RequestAxiosCall.get(testUrl).catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(404);
            expect(err.response.statusText).toMatch("Not Found");
        });
    });
    test('Request Query Ok parameter group 1', async () => {
        expect.assertions(6);
        await service.addRequest(testRequest);
        return RequestAxiosCall.get(testUrl).then(async (response: any) => {
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
        await service.addRequest(testRequest);
        return RequestAxiosCall.get(testUrl2).then(async (response: any) => {
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
        await service.addRequest(testRequest);
        return RequestAxiosCall.get(testUrl3).then(async (response: any) => {
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
        service.addRequest(testRequest);
        return RequestAxiosCall.get(testUrlMissingQuery).catch(async err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(400);
            expect(err.response.statusText).toMatch("Bad Request");
            expect(err.response.data.status).toMatch("Error");
            expect(err.response.data.message).toMatch("Parameters 'x', 'y' were not found in query");
        });
    });
});