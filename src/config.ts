import dotenv from 'dotenv';

dotenv.config({});

class Config {
  public NODE_ENV: string | undefined;
  public RABBITMQ_ENDPOINT: string | undefined;
  public MYSQL_DB: string;
  public MYSQL_USERNAME: string;
  public MYSQL_PASSWORD: string;
  public MYSQL_DATABASE: string;
  public MYSQL_PORT: number;
  public MYSQL_HOST: string;
  public JWT_TOKEN: string;
  public GATEWAY_JWT_TOKEN: string | undefined;
  public API_GATEWAY_URL: string | undefined;
  public CLIENT_URL: string | undefined;
  public ELASTIC_SEARCH_URL: string | undefined;
  public ELASTIC_SEARCH_USERNAME: string;
  public ELASTIC_SEARCH_PASSWORD: string;
  public SERVER_PORT: number;

  constructor() {
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
    this.MYSQL_DATABASE = process.env.MYSQL_DATABASE!;
    this.MYSQL_HOST = process.env.MYSQL_HOST!;
    this.MYSQL_USERNAME = process.env.MYSQL_USERNAME!;
    this.MYSQL_PASSWORD = process.env.MYSQL_PASSWORD!;
    this.MYSQL_PORT = Number(process.env.MYSQL_PORT) || 3306;
    this.MYSQL_DB = `mysql://${this.MYSQL_USERNAME}:${this.MYSQL_PASSWORD}@${this.MYSQL_HOST}:${this.MYSQL_PORT}`;
    this.JWT_TOKEN = process.env.JWT_TOKEN || 'rMNKMcXf0CRSRSQ';
    this.GATEWAY_JWT_TOKEN = process.env.GATEWAY_JWT_TOKEN || 'CawcWeavGpk6n6A';
    this.API_GATEWAY_URL = process.env.API_GATEWAY_URL || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
    this.ELASTIC_SEARCH_USERNAME = process.env.ELASTIC_SEARCH_USERNAME || '';
    this.ELASTIC_SEARCH_PASSWORD = process.env.ELASTIC_SEARCH_PASSWORD || '';
    this.SERVER_PORT = Number(process.env.PORT) || 4002;
  }
}

export const config: Config = new Config();