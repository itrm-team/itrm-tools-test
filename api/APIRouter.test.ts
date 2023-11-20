import { NextFunction, Request, Response, RouterOptions } from "express";
import { APIService, SimpleAPIRouter, GetRequest, APIRouter, RequestAxiosCall } from "../../dist";
import { config } from "./APITestDefinitions";

class TestRequest extends GetRequest {
    constructor() {
        super({
            path: "/test",
            params: []
        });
    }

    public async apply(req: Request, res: Response): Promise<any> {
        return res.status(200).json({ message: 'Success' });
    }
}

class TestRouter extends APIRouter {
    constructor(path: string, options?: RouterOptions) {
        super(path, options);
    }

    protected async runMiddleware(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        let { cancel } = req.query;
        if (cancel)
            return res.status(400).json({ message: "Cancelled" });
        return next();
    }
}

const service = new APIService(config);
service.init();

const request = new TestRequest();
const router1 = new SimpleAPIRouter("/route1");
router1.init();
router1.addRequest(request);
service.addRouter(router1);

const router2 = new TestRouter("/route2");
router2.init();
router2.addRequest(request);
service.addRouter(router2);

describe('testing Router', () => {
    beforeAll(async () => {
        await service.run(() => {});
    });
    afterAll(async () => {
        await service.close(() => {})
    });
    test("> test route1 request", async() => {
        expect.assertions(1);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.get(`http://localhost:${config.port}/route1/test`)
        .then(async (response: any) => {
            expect(response.message).toMatch("Success");
        });
    });
    test("> test route2 request", async() => {
        expect.assertions(1);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.get(`http://localhost:${config.port}/route2/test`)
        .then(async (response: any) => {
            expect(response.message).toMatch("Success");
        });
    });
    test("> test route2 middleware cancel request", async() => {
        expect.assertions(3);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.get(`http://localhost:${config.port}/route2/test?cancel=true`)
        .catch(async err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(400);
            expect(err.response.data.message).toMatch("Cancelled");
        });
    });
});