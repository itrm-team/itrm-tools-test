import { Request, Response } from "express";
import { RequestContext, PostRequest, APIService, RequestAxiosCall, RequestParameterType } from "../../../dist";
import { config } from "../APITestDefinitions";

const service = new APIService(config);
service.init();

class TestRequest extends PostRequest {
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

class UnexpectedErrorTestRequest extends PostRequest {
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

describe('testing POST Request', () => {
    beforeAll(async () => {
        await service.run(() => { });
    });
    afterAll(async () => {
        await service.close(() => { })
    });
    test('Refuse request when API Request does not exist', async () => {
        expect.assertions(3);
        return RequestAxiosCall.post(testUrl, { date: 'date' }, {
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://valid.com' }
        }).catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(404);
            expect(err.response.statusText).toMatch("Not Found");
        });
    });
    test('Request Query Ok parameter group 1', async () => {
        expect.assertions(6);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.post(testUrl, { date: 'date' }, {
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://valid.com' }
        }).then((response: any) => {
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
        return RequestAxiosCall.post(testUrl2, { date: 'date' })
            .then((response: any) => {
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
        return RequestAxiosCall.post(testUrl3, { date: 'date' })
            .then((response: any) => {
                expect(response.message).toMatch("Success");
                expect(response.method).toMatch("testing");
                expect(response.type).toBeUndefined();
                expect(response.option).toBeUndefined();
                expect(response.x).toMatch("10");
                expect(response.y).toMatch("20");
            });
    });
    test('Request Query Ok parameter group 4', async () => {
        expect.assertions(9);
        return RequestAxiosCall.post(testUrl3, { date: 'date' })
            .then((response: any) => {
                expect(response.message).toMatch("Success");
                expect(response.method).toMatch("testing");
                expect(response.type).toBeUndefined();
                expect(response.option).toBeUndefined();
                expect(response.x).toMatch("10");
                expect(response.y).toMatch("20");
                expect(response.date).toMatch("date");
                expect(response.time).toBeUndefined();
                expect(response.timestamp).toBeUndefined();
            });
    });
    test('Request Query Ok parameter group 5', async () => {
        expect.assertions(9);
        return RequestAxiosCall.post(testUrl3, { time: 'time', timestamp: 10000000 })
            .then((response: any) => {
                expect(response.message).toMatch("Success");
                expect(response.method).toMatch("testing");
                expect(response.type).toBeUndefined();
                expect(response.option).toBeUndefined();
                expect(response.x).toMatch("10");
                expect(response.y).toMatch("20");
                expect(response.date).toBeUndefined();
                expect(response.time).toMatch("time");
                expect(response.timestamp).toBe(10000000);
            });
    });
    test('Request Error: missing parameter in query', async () => {
        expect.assertions(5);
        return RequestAxiosCall.post(testUrlMissingQuery, { date: 'date' })
            .catch(err => {
                expect(err.code).toMatch("ERR_BAD_REQUEST");
                expect(err.response.status).toBe(400);
                expect(err.response.statusText).toMatch("Bad Request");
                expect(err.response.data.status).toMatch("Error");
                expect(err.response.data.message).toMatch("Parameters 'x', 'y' were not found in query");
            });
    });
    test('Check values property', async () => {
        expect.assertions(14);
        return RequestAxiosCall.post(testUrl3, {
            values: [{ date: 'date' }, { time: 'time', timestamp: 10000000 }]
        }).then((response: any) => {
            console.log("> response:", response);
            expect(response.message).toMatch("Success");
            expect(response.method).toMatch("testing");
            expect(response.type).toBeUndefined();
            expect(response.option).toBeUndefined();
            expect(response.x).toMatch("10");
            expect(response.y).toMatch("20");
            expect(response.date).toBeUndefined();
            expect(response.time).toBeUndefined();
            expect(response.timestamp).toBeUndefined();
            expect(response.values).toBeDefined();
            expect(response.values.length).toBe(2);
            expect(response.values[0].date).toMatch("date");
            expect(response.values[1].time).toMatch("time");
            expect(response.values[1].timestamp).toBe(10000000);
        });
    });
    test('Check missing property in values', async () => {
        return RequestAxiosCall.post(testUrl3, {
            values: [{ date: 'date' }, { time: 'time' }]
        })
            .catch((err: any) => {
                console.log("> err:", err.response.data.message);
                expect(err.code).toMatch("ERR_BAD_REQUEST");
                expect(err.response.status).toBe(400);
                expect(err.response.statusText).toMatch("Bad Request");
                expect(err.response.data.status).toMatch("Error");
                expect(err.response.data.message).toMatch("Parameters 'timestamp' were not found in body, item 2");
            });
    });
    test('Check missing parameter and wrong type in values', async () => {
        return RequestAxiosCall.post(testUrl3, {
            values: [{ date: 'date' }, { timestamp: 'time' }]
        })
            .catch((err: any) => {
                console.log("> err:", err.response.data.message);
                expect(err.code).toMatch("ERR_BAD_REQUEST");
                expect(err.response.status).toBe(400);
                expect(err.response.statusText).toMatch("Bad Request");
                expect(err.response.data.status).toMatch("Error");
                expect(err.response.data.message).toMatch("Parameters 'time' were not found in body and 'timestamp' have invalid type , item 2");
            });
    });
    test('Check wrong type in values', async () => {
        return RequestAxiosCall.post(testUrl3, {
            values: [{ date: 'date' }, { time: 'time', timestamp: 'time' }]
        })
            .catch((err: any) => {
                console.log("> err:", err.response.data.message);
                expect(err.code).toMatch("ERR_BAD_REQUEST");
                expect(err.response.status).toBe(400);
                expect(err.response.statusText).toMatch("Bad Request");
                expect(err.response.data.status).toMatch("Error");
                expect(err.response.data.message).toMatch("Parameters 'timestamp' have invalid type , item 2");
            });
    });
});