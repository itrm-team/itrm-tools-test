import { APIRequestBuilder, APIService, GetRequest, PostRequest, PutRequest, RequestAxiosCall, RequestContext, RequestParameterType, SimpleCheckableAPIRouter } from "../../../dist";
import { Request, Response } from "express";
import { config } from "../APITestDefinitions";
import puppeteer from 'puppeteer';

jest.useFakeTimers();

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
            context: RequestContext.HEADERS,
            properties: [{ name: "x-header", type: RequestParameterType.STRING }]
        }
    ];
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
            }, {
                status: 400,
                input: { x: 5 },
                output: {
                    message: "Falta la y",
                    error: "Missing parameters",
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

class TestPostRequest extends PostRequest {
    constructor() {
        super({
            path: '/test/:method/type',
            params: [{
                context: RequestContext.BODY,
                properties: [{ name: "value", type: RequestParameterType.OBJECT }]
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
                context: RequestContext.BODY,
                properties: [{ name: "date", type: RequestParameterType.STRING }]
            }, {
                context: RequestContext.BODY,
                properties: [
                    { name: "time", type: RequestParameterType.STRING },
                    { name: "timestamp", type: RequestParameterType.NUMBER }
                ]
            }]
        });
    }

    async apply(req: Request, res: Response): Promise<any> {
        const { method } = req.params;
        const { value, option, x, y } = req.query;
        const { date, time, timestamp, values } = req.body;
        return res.status(200).json({ message: "Success", method: method, type: value, option: option, date: date, time: time, x: x, y: y, timestamp: timestamp, values: values });
    }
}

class TestPutRequest extends PutRequest {
    constructor() {
        super({
            path: '/test/:method',
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
            }, {
                context: RequestContext.BODY,
                properties: [{ name: "date", type: RequestParameterType.STRING }]
            }],
        });
    }

    async apply(req: Request, res: Response): Promise<any> {
        const { method } = req.params;
        const { value, option, x, y } = req.query;
        const { date, time, timestamp, values } = req.body;
        return res.status(200).json({ message: "Success", method: method, type: value, option: option, date: date, time: time, x: x, y: y, timestamp: timestamp, values: values });
    }
}

const router = new SimpleCheckableAPIRouter("/route");

router.init();
router.addRequest(new TestRequest(new TestRequestBuilder()));
router.addRequest(new TestPostRequest());
router.addRequest(new TestPutRequest());

service.addRouter(router);

service.enableDocumentation();

const swaggerUrl = `http://localhost:${config.port}/api-docs`;

describe('Testing Documentation', () => {
    beforeAll(async () => {
        await service.run(() => { });
    });
    afterAll(async () => {
        await service.close(() => { })
    });
    test('Testing JSON', async () => {
        // expect.assertions(1);
        return RequestAxiosCall.get(swaggerUrl).then((response: any) => {
            console.log("get");
        });
    });
    // jest.setTimeout(300000);
    // test('Testing Swagger UI', async () => {
    //     const browser = await puppeteer.launch({ headless: false });
    //     const page = await browser.newPage();
    //     await page.goto(`http://localhost:${config.port}/api-docs`);
    //     // await browser.close();
    //     await new Promise(r => setTimeout(r, 300000));
    //     return RequestAxiosCall.get(swaggerUrl).then((response: any) => {
    //         console.log(response);
    //     });
    // });
});

