import { Module, DynamicModule } from '@nestjs/common';
import { IMessagePubSub } from './message-pub-sub.interface';
import {
  MessagePubSubService,
  MESSAGE_PUBSUB_ADAPTER,
} from './message-pub-sub.service';
// import { KafkaPubSubAdapter } from './adapters/kafka.adapter';
import { PinoLogger } from 'nestjs-pino';
import { MqttPubSubAdapter } from './adapters/mqtt.adapter';
import { RabbitMqPubSubAdapter } from './adapters/rabbit.adapter';

export type PubSubAdapterType = 'kafka' | 'mqtt' | 'rabbitmq';

export interface MessagePubSubModuleOptions {
  adapter: PubSubAdapterType;

  // Kafka Config:
  kafkaBrokers?: string[]; // List of Kafka broker addresses
  kafkaGroupId?: string; // Consumer group ID (default: 'default-group')
  kafkaClientId?: string; // Unique client ID (default: 'default-client')
  kafkaTopic?: string; // Default topic (optional)

  // MQTT Config:
  mqttBrokerUrl?: string; // e.g. 'mqtt://localhost:1883'
  mqttOptions?: any; // e.g. { username, password, etc. }

  // RabbitMQ:
  rabbitUrl?: string; // e.g., 'amqp://localhost'
  rabbitExchange?: string; // e.g., 'my-topic-exchange'
  rabbitQueueName?: string; // Optional queue name (otherwise random)
  prefetchCount?: number; // Number of messages to prefetch (default: 1)
}
@Module({})
export class MessagePubSubModule {
  static forRoot(options: MessagePubSubModuleOptions): DynamicModule {
    return {
      module: MessagePubSubModule,
      providers: [
        {
          provide: MESSAGE_PUBSUB_ADAPTER,
          useFactory: (logger: PinoLogger): IMessagePubSub => {
            switch (options.adapter) {
              // case 'kafka':
              //   if (!options.kafkaBrokers || options.kafkaBrokers.length === 0) {
              //     throw new Error(`kafkaBrokers are required for 'kafka' adapter`);
              //   }
              //   return new KafkaPubSubAdapter(
              //     options.kafkaBrokers,
              //     options.kafkaGroupId || 'default-group',
              //     options.kafkaClientId || 'default-client',
              //     logger,
              //   );
              case 'mqtt':
                if (!options.mqttBrokerUrl) {
                  throw new Error(
                    `mqttBrokerUrl is required for 'mqtt' adapter`
                  );
                }
                return new MqttPubSubAdapter(
                  options.mqttBrokerUrl,
                  options.mqttOptions || {},
                  logger
                );
              case 'rabbitmq':
                if (!options.rabbitUrl) {
                  throw new Error(
                    `rabbitUrl is required for 'rabbitmq' adapter`
                  );
                }
                return new RabbitMqPubSubAdapter(
                  options.rabbitUrl,
                  logger,
                  options.rabbitExchange || 'nest-pubsub-exchange',
                  options.rabbitQueueName || '',
                  options.prefetchCount || 1
                );
              default:
                throw new Error(`Unknown adapter type: ${options.adapter}`);
            }
          },
        },
        MessagePubSubService,
      ],
      exports: [MessagePubSubService],
    };
  }
}
