import { MongooseModelManager } from "../../../dist";
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { connect, disconnect } from "mongoose";

mongoose.set('strictQuery', false);

interface TestValue {
    value: string
}

interface Test {
    testId: number,
    name: string,
    values: TestValue[]
}

class TestManager extends MongooseModelManager<Test> {
    constructor() {
        super("test", {
            testId: { type: Number, required: true },
            name: { type: String, required: true },
            values: {
                type: [{
                    value: { type: String, required: true }
                }],
                required: true
            }
        });
    }
}

const manager = new TestManager();
let mongodb: MongoMemoryServer | undefined = undefined;

describe("> Testing Mongoose Model Manager", () => {
    beforeAll(async() => {
        mongodb  = await MongoMemoryServer.create();
        let url = await mongodb?.getUri() || "NONE";
        await connect(url);
    });
    afterAll(async() => {
        await disconnect();
        await mongodb?.stop();
    });
    test("> Create", async() => {
        let token: any = await manager.create({
            name: 'test1',
            testId: 1,
            values: [{ value: 'value1' }]
        });
        expect(token.name).toMatch('test1');
        expect(token.testId).toBe(1);
    });
    test("> Create Many", async() => {
        let result = await manager.createMany([{
            name: 'test2',
            testId: 2,
            values: [{ value: 'value2' }]
        }, {
            name: 'test3',
            testId: 3,
            values: [{ value: 'value3' }]
        }]);
        expect(result.ok).toBe(1);
        expect(result.nInserted).toBe(2);
    });
    test("> Exists", async() => {
        let result = await manager.exists({ testId: 2 });
        expect(result).toBeDefined();
        result = await manager.exists({ testId: 4 });
        expect(result).toBeNull();
    });
    test("> Find", async() => {
        let token: any = await manager.find({ testId: 1 });
        expect(token.name).toMatch('test1');
        expect(token.testId).toBe(1);
    });
    test("> Find Many", async() => {
        let tokens: any[] = await manager.findMany({
            testId: { $gt: 1 }
        });
        expect(tokens.length).toBe(2);
        expect(tokens[0].name).toMatch('test2');
        expect(tokens[0].testId).toBe(2);
        expect(tokens[1].name).toMatch('test3');
        expect(tokens[1].testId).toBe(3);
    });
    test("> Batch", async() => {
        let tokens: any[] = await manager.batch({}, 1, 2);
        expect(tokens.length).toBe(2);
        expect(tokens[0].name).toMatch('test2');
        expect(tokens[0].testId).toBe(2);
        expect(tokens[1].name).toMatch('test3');
        expect(tokens[1].testId).toBe(3);
    });
    test("Bulk Write", async() => {
        await manager.bulkWrite([{
            updateOne: {
                filter: { testId: 1 },
                update: { name: 'test_1' },
            }
        }, {
            insertOne: {
                document: {
                    name: 'test4',
                    testId: 4,
                    values: [{ value: 'value4' }]
                }
            }
        }, {
            deleteOne: {
                filter: { testId: 2 }
            }
        }]);
        let update = await manager.find({ testId: 1 });
        expect(update?.name).toMatch('test_1');
        let insertion = await manager.find({ testId: 4 });
        expect(insertion?.name).toMatch('test4');
        let deletion = await manager.find({ testId: 2 });
        expect(deletion).toBeNull();
    });
    test("> Count Documents", async() => {
        expect(await manager.countDocuments({
            testId: { $gt: 1 }
        })).toBe(2);
    });
    test("> Delete", async() => {
        let deletion = await manager.delete({ testId: 1 });
        expect(deletion.deletedCount).toBe(1);
        expect(await manager.countDocuments({})).toBe(2);
        expect(await manager.find({ testId: 1 })).toBeNull();
    });
    test("> Delete Many", async() => {
        let deletion = await manager.deleteMany({ testId: { $gt: 1 } });
        expect(deletion.deletedCount).toBe(2);
        expect(await manager.countDocuments({})).toBe(0);
        expect(await manager.find({ testId: 3 })).toBeNull();
        expect(await manager.find({ testId: 4 })).toBeNull();
    });
});