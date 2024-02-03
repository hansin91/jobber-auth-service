import { config } from '@auth/config';
import { winstonLogger } from '@hansin91/jobber-shared';
import { Channel } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from '@auth/queues/connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authServiceProducer', 'debug');

export interface DirectMessage {
  channel: Channel;
  exchangeName: string;
  routingKey: string;
  message: string;
  logMessage: string;
}

export const publishDirectMessage = async (payload: DirectMessage) => {
  try {
    let { channel } = payload;
    const { exchangeName, logMessage, routingKey, message } = payload;
    if (!channel) {
      channel = await createConnection() as Channel;
    }
    await channel.assertExchange(exchangeName, 'direct');
    channel.publish(exchangeName, routingKey, Buffer.from(message));
    log.info(logMessage);
  } catch (error) {
    log.log('error', 'AuthService Provider publishDirectMessage() method error:', error);
  }
};