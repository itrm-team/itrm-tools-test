import { Request, Response } from "express";
import { APIService, SimpleCheckableAPIRouter, GetRequest, RequestAxiosCall } from "../../../dist";
import { config } from "../APITestDefinitions";
import { check, unexpectedErrorCheck } from './CheckDefinitions';

class TestRequest extends GetRequest {
    constructor() {
        super({
            path: "/test",
            params: []
        });
    }

    public async apply(req: Request, res: Response): Promise<any> {
        console.log("> checkResults:", req.body.checkResults);
        return res.status(200).json({ message: 'Success', checkResults: req.body.checkResults });
    }
}

const service = new APIService(config);
service.init();

const request = new TestRequest();
const router = new SimpleCheckableAPIRouter("/route");
router.init();
router.addCheck(check);
router.addRequest(request);
service.addRouter(router);

describe('testing Checkable Router', () => {
    beforeAll(async () => {
        await service.run(() => {});
    });
    afterAll(async () => {
        await service.close(() => {})
    });
    test("> test valid route request", async() => {
        expect.assertions(3);
        await service.addRequest(new TestRequest());
        return RequestAxiosCall.get(`http://localhost:${config.port}/route/test?key=valid`)
        .then(async (response: any) => {
            expect(response.message).toMatch("Success");
            expect(response.checkResults).toBeDefined();
            expect(response.checkResults[check.getConfig().check]).toMatchObject({ message: 'Accepted' });
        });
    });
    test('> test invalid route request', async () => {
        expect.assertions(4);
        return RequestAxiosCall.get(`http://localhost:${config.port}/route/test?key=invalid`)
        .catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(401);
            expect(err.response.statusText).toMatch("Unauthorized");
            expect(err.response.data.message).toMatch("key does not match");
        });
    });
    test('Checking invalid route request with no unauthorization reason', async () => {
        expect.assertions(4);
        return RequestAxiosCall.get(`http://localhost:${config.port}/route/test?key=unknown`)
        .catch(err => {
            expect(err.code).toMatch("ERR_BAD_REQUEST");
            expect(err.response.status).toBe(401);
            expect(err.response.statusText).toMatch("Unauthorized");
            expect(err.response.data.message).toMatch("Unknown reason");
        });
    });
});