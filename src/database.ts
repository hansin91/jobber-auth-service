import { winstonLogger } from '@hansin91/jobber-shared';
import { Logger } from 'winston';
import { config } from '@auth/config';
import { Sequelize } from 'sequelize';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

export const sequelize: Sequelize = new Sequelize(config.MYSQL_DB, {
  dialect: 'mysql',
  logging: false,
  database: config.MYSQL_DATABASE,
  dialectOptions: {
    multipleStatements: true
  }
});

export const databaseConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    log.info('AuthService MySql database connection has been established');
  } catch (error) {
    log.error('Auth Service - Unable connect to database');
    log.log('error', 'AuthService databaseConnection() method error', error);
  }
};

