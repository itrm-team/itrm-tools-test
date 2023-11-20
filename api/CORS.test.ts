import { APIService, ITRMAPIServiceGlobal, RequestAxiosCall } from "../../dist";
import { config } from "./APITestDefinitions";

const service = new APIService(config);
service.init();

describe("Testing CORS", () => {
    beforeAll(async () => {
        await service.run(() => {});
    });
    afterAll(async () => {
        await service.close(() => {})
    });
    test('Checking invalid route has not been blocked', async() => {
        expect.assertions(1);
        return RequestAxiosCall.get("http://localhost:" + config.port, {
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://invalid.com' }
        })
        .then(response => {
            expect(response).toMatch("Server working!");
        });
    });
    // test('Checking invalid route was blocked', async() => {
    //     ITRMAPIServiceGlobal.whitelist = ["https://valid.com"];
    //     expect.assertions(4);
    //     return RequestAxiosCall.get("http://localhost:" + config.port, {
    //         headers: { 'Content-Type': 'application/json', 'Origin': 'https://invalid.com' }
    //     })
    //     .catch(err => {
    //         expect(err.code).toMatch("ERR_BAD_RESPONSE");
    //         expect(err.response.status).toBe(500);
    //         expect(err.response.statusText).toMatch("Internal Server Error");
    //         expect(err.response.data).toMatch("Not allowed by CORS");
    //     });
    // });
    test('Checking valid route was not blocked', async() => {
        expect.assertions(1);
        return RequestAxiosCall.get("http://localhost:" + config.port, {
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://valid.com' }
        })
        .then(response => {
            expect(response).toMatch("Server working!");
        });
    });
    test('Checking invalid route was released', async() => {
        expect.assertions(1);
        ITRMAPIServiceGlobal.whitelist = [];
        return RequestAxiosCall.get("http://localhost:" + config.port, {
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://invalid.com' }
        })
        .then(response => {
            expect(response).toMatch("Server working!");
        });
    });
});