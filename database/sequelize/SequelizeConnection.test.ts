import { SequelizeConnection } from '../../../dist';
import { config } from './SequealizeDefinitions';
import { DataTypes } from '@sequelize/core';

const validConnection = new SequelizeConnection(config);

describe("Testing Sequalize Connection", () => {
    test("Connect OK", async () => {
        expect(await validConnection.connect()).toBeUndefined();
    });
    test("Define Model", async () => {
        let model = await validConnection.define('Test', {
            testId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            tableName: 'Tests'
        });
        expect(model.name).toMatch('Test');
        expect(model.tableName).toMatch('Tests');
    });
    test("Disconnect OK", async () => {
        expect(await validConnection.disconnect()).toBeUndefined();
    });
});