import { APIService, APIServiceResponse, RequestAxiosCall } from '../../dist';
import { config } from './APITestDefinitions';

const service = new APIService(config);
service.init();

describe('testing APIService', () => {
    test('running OK', async () => {
        expect.assertions(3);
        return service.run(() => {}).then((response: APIServiceResponse) => {
            expect(response.status).toStrictEqual("Ok");
            expect(response.message).toStrictEqual("Server has been Initialized");
            expect(response.error).toBeUndefined();
        });
    });
    test('Server working!', async() => {
        expect.assertions(1);
        return RequestAxiosCall.get("http://localhost:" + config.port).then(response => {
            expect(response).toMatch("Server working!");
        });
    });
    test('closing OK', async () => {
        expect.assertions(3);
        return service.close(() => {}).then((response: APIServiceResponse) => {
            expect(response.status).toStrictEqual("Ok");
            expect(response.message).toStrictEqual("Server has been closed");
            expect(response.error).toBeUndefined();
        });
    });
    test('running Fail', () => {
        expect.assertions(3);
        return service.run(() => { throw "testing failure"; })
        .catch(async (response: APIServiceResponse) => {
            expect(response.status).toStrictEqual("Error");
            expect(response.message).toStrictEqual("An error has ocurred in the initialization function");
            expect(response.error).toBe("testing failure");
            await service.close(() => {});
        });
    });
    test('closing Fail', async () => {
        expect.assertions(3);
        await service.run(() => {});
        return service.close(() => { throw "testing failure"; })
        .catch(async (response: APIServiceResponse) => {
            expect(response.status).toMatch("Error");
            expect(response.message).toMatch("An error has ocurred in the closing function");
            expect(response.error).toMatch("testing failure");
        });
    });
});