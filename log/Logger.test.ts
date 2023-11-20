import { Logger } from '../../dist';
import { v4 as uuidv4, validate } from 'uuid';
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

const EXECUTOR = "https://services.itrmachines.com/log-executor/";
const LOGGER = "https://services.itrmachines.com/log-executor/send";

const logger: Logger = new Logger(EXECUTOR, LOGGER);

describe("> testing Logger", () => {
    let mock: MockAdapter;
    let executionId: string;
    beforeAll(() => {
        mock = new MockAdapter(axios);
    });
    afterEach(() => {
        mock.reset();
    });
    test("> testing request a new extecution Id", async () => {
        mock.onPost(`${EXECUTOR}/generateid`).reply(200, uuidv4() + "87");
        executionId = await logger.requestExecutionId();
        expect(executionId.length).toBeGreaterThan(36);
        expect(validate(executionId.substring(0, 36))).toBeTruthy();
    });
    test("> testing sending a log", async () => {
        mock.onPost(LOGGER).reply(404, { log: {} });
        return await logger.send({})
        .catch((err: any) => {
            expect(err.message).toMatch('Request failed with status code 404');
            expect(err.response.status).toBe(404);
        });
    });
    test("> testing sending a log", async () => {
        mock.onPost(LOGGER).reply(200, 'Ok');
        return await logger.send({
            timestamp: 10000000,
            executionId: '7752a2cc-676f-4c0f-881f-8bb6086ab7f21',
            data: {}
        }).then((response: any) => {
            expect(response).toMatch('Ok');
        });
    });
});