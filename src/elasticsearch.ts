import { ISellerGig, winstonLogger } from '@hansin91/jobber-shared';
import { Logger } from 'winston';
import { Client } from '@elastic/elasticsearch';
import { ClusterHealthResponse, GetResponse } from '@elastic/elasticsearch/lib/api/types';
import { config } from '@auth/config';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authElasticSearchServer', 'debug');
const elasticSearchClient = new Client({
  node: `${config.ELASTIC_SEARCH_URL}`,
  auth: {
    username: config.ELASTIC_SEARCH_USERNAME,
    password: config.ELASTIC_SEARCH_PASSWORD
  },
});

const checkConnection = async (): Promise<void> => {
  let isConnected = false;
  while (!isConnected) {
    log.info('AuthService connecting to ElasticSearch...');
    try {
      const health: ClusterHealthResponse = await elasticSearchClient.cluster.health({});
      log.info(`AuthService Elasticsearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      log.error('Connection to Elasticsearch failed. Retrying...');
      log.log('error', 'AuthService checkConnection() method:', error);
    }
  }
};

const checkExistingIndex = async (indexName: string): Promise<boolean> => {
  const result: boolean = await elasticSearchClient.indices.exists({ index: indexName });
  return result;
};

const createIndex = async (indexName: string): Promise<void> => {
  try {
    const result: boolean = await checkExistingIndex(indexName);
    if (result) {
      log.info(`Index ${indexName} already exist`);
    } else {
      await elasticSearchClient.indices.create({ index: indexName });
      await elasticSearchClient.indices.refresh({ index: indexName });
      log.info(`Created index ${indexName}`);
    }
  } catch (error) {
    log.error(`Error occured while creating the index ${indexName}`);
    log.log('error', 'AuthService createIndex() method:', error);
  }
};

const getDocumentById = async (index: string, gigId: string): Promise<ISellerGig> => {
  try {
    const result: GetResponse = await elasticSearchClient.get({
      index,
      id: gigId
    });
    return result._source as ISellerGig;
  } catch (error) {
    log.log('error', 'AuthService elasticsearch getDocumentById() method error:', error);
    return {} as ISellerGig;
  }
};

export { elasticSearchClient, checkConnection, createIndex, getDocumentById };