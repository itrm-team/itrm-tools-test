import { Options } from '@sequelize/core';

export const config: Options = {
    database: './database.db',
    dialect: "sqlite",
    logging: false
};