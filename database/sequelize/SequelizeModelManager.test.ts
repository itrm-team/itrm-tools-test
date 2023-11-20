import { DataTypes } from '@sequelize/core';
import { SequelizeConnection, SequelizeModelManager } from '../../../dist';
import { config } from './SequealizeDefinitions';

interface Test {
    testId: number,
    name: string
}

interface TestB {
    testId: number,
    name: string
}

const connection = new SequelizeConnection(config);
const manager = new SequelizeModelManager<Test>({
    name: 'Test',
    attributes: {
        testId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
});

const managerB = new SequelizeModelManager<TestB>({
    name: 'TestB',
    attributes: {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
});

const managerC = new SequelizeModelManager<TestB>({
    name: 'TestC',
    attributes: {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
});

describe("Testing Sequelize Model Manager", () => {
    beforeAll(async () => {
        await connection.connect();
        await managerB.define(connection);
        await managerC.define(connection);
    });
    afterAll(async() => {
        await connection.disconnect();
    });
    test("Init Model", async () => {
        await manager.define(connection);
        let result = await manager.sync();
        expect(result.name).toMatch('Test');
        expect(result.tableName).toMatch('Tests');
    });
    test("Insert", async () => {
        expect.assertions(2);
        return manager.create({
            testId: 1,
            name: 'test1'
        }).then((response: any) => {
            expect(response.dataValues.testId).toBe(1);
            expect(response.dataValues.name).toMatch('test1');
        });
    });
    test("Insert Fail", async () => {
        expect.assertions(2);
        return manager.create({
            testId: 1,
            name: 'test1'
        }).catch((err: any) => {
            expect(err.name).toMatch('SequelizeUniqueConstraintError');
            expect(err.errors[0].message).toMatch('testId must be unique');
        });
    });
    test("Insert Many", async () => {
        expect.assertions(4);
        return manager.bulkCreate([{
            testId: 2,
            name: 'test2'
        }, {
            testId: 3,
            name: 'test3'
        }]).then((response: any) => {
            expect(response[0].dataValues.testId).toBe(2);
            expect(response[0].dataValues.name).toMatch('test2');
            expect(response[1].dataValues.testId).toBe(3);
            expect(response[1].dataValues.name).toMatch('test3');
        });
    });
    test("Update", async () => {
        expect.assertions(1);
        return manager.update({
            name: 'test2'
        }, {
            where: {
                testId: 1
            }
        }).then((response: any) => {
            expect(response[0]).toBeGreaterThan(0);
        });
    });
    test("Find All", async () => {
        expect.assertions(2);
        return manager.findAll({
            where: {
                testId: 1
            }
        }).then((response: any) => {
            expect(response[0].dataValues.testId).toBe(1);
            expect(response[0].dataValues.name).toMatch('test2');
        });
    });
    test("Delete", async () => {
        expect.assertions(1);
        return manager.destroy({
            where: {
                testId: [1, 2, 3]
            }
        }).then((response: any) => {
            expect(response).toBeGreaterThan(0);
        });
    });
    test("> testing hasOne:", async () => {
        let response = await manager.hasOne(managerB);
        console.log("> hasOne response:", response);
    });
    test("> testing hasMany:", async () => {
        let response = await manager.hasMany(managerB);
        console.log("> hasMany response:", response);
        //expect(response).toMatch("TestBs");
    });
    test("> testing belongsTo:", async () => {
        let response = await managerB.belongsTo(manager);
        /*expect(response.associationType).toMatch("BelongsTo");
        expect(response.associationAccessor).toMatch("Test");
        expect(response.foreignKey).toMatch("TestId");*/
    });
    test("> testing belongsToMany:", async () => {
        let response = await managerC.belongsToMany(managerB, { through: "" });
        /*expect(response.associationType).toMatch("BelongsToMany");
        expect(response.associationAccessor).toMatch("TestBs");
        expect(response.foreignKey).toMatch("TestId");*/
    });
});