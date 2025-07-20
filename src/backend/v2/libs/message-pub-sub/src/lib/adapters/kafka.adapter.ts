import {
  CloudEvent,
  IMessagePubSub,
  PubSubTopicsOptions,
} from '../message-pub-sub.interface';
import {
  Kafka,
  Producer,
  Consumer,
  EachMessagePayload,
  logLevel,
  Partitioners
} from 'kafkajs';
import { PinoLogger } from 'nestjs-pino';

export class KafkaPubSubAdapter implements IMessagePubSub {
  private producer: Producer;
  private consumer: Consumer;
  private kafka: Kafka;

  private isProducerConnected = false;
  private isConsumerConnected = false;
  private isConsumerRunning = false;

  // We'll store the RegExp topics to filter them manually
  private regexTopics: RegExp[] = [];
  // We'll store string topics to check membership
  private stringTopics: Set<string> = new Set();

  constructor(
    brokers: string[],
    private readonly groupId = 'my-group',
    private readonly clientId = 'my-client',
    private readonly logger: PinoLogger,
  ) {
    this.kafka = new Kafka({
      clientId,
      brokers,
      logLevel: logLevel.ERROR,
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });

    this.consumer = this.kafka.consumer({
      groupId,
      retry: { retries: 5 },
    });

    // If logger is missing, fall back to a minimal PinoLogger
    if (!logger) {
      this.logger = new PinoLogger({ renameContext: KafkaPubSubAdapter.name });
    }
  }

  private async connectProducer(): Promise<void> {
    if (!this.isProducerConnected) {
      await this.producer.connect();
      this.isProducerConnected = true;
      this.logger.info('Kafka producer connected');
    }
  }

  /**
   * Publish a message to a Kafka topic.
   */
  async sendMessage<T>(topic: string, message: CloudEvent<T>): Promise<void> {
    if (!topic) {
      throw new Error('Topic is required for Kafka message publishing');
    }

    try {
      await this.connectProducer();

      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.info({ topic, messageId: message.id }, 'Message published to Kafka');
    } catch (error) {
      this.logger.error({ error, topic }, 'Error publishing message to Kafka');
      throw new Error(`Failed to send message to Kafka topic: ${topic}`);
    }
  }

  private async connectConsumer(): Promise<void> {
    if (!this.isConsumerConnected) {
      await this.consumer.connect();
      this.isConsumerConnected = true;
      this.logger.info({}, 'Kafka consumer connected');
    }
  }

  /**
   * Subscribe to one or more topics (string or RegExp).
   *
   * - For string topics, we tell Kafka to subscribe directly.
   * - For RegExp topics (KafkaJS doesn’t support natively), we store them
   *   and manually filter in the `eachMessage` callback.
   *
   * @param options e.g. { topics: ['my-topic', /^prefix\-.+/ ] }
   */
  async receiveMessage<T>(
    options: PubSubTopicsOptions,
    handler: (msg: CloudEvent<T>) => Promise<void>,
  ): Promise<void> {
    if (!options.topics || options.topics?.length === 0) {
      throw new Error('At least one topic (string or RegExp) is required for Kafka subscription');
    }

    await this.connectConsumer();

    // Separate string topics from RegExp topics
    const stringTopics = options.topics.filter(t => typeof t === 'string') as string[];
    const regexTopics = options.topics.filter(t => t instanceof RegExp) as RegExp[];

    // Subscribe to all string topics at once
    if (stringTopics.length > 0) {
      // Deduplicate or store them in a set
      const uniqueTopics = [...new Set(stringTopics)];
      this.logger.info({ topics: uniqueTopics }, 'Subscribing to Kafka string topics');

      await this.consumer.subscribe({
        topics: uniqueTopics,
        fromBeginning: true,
      });
    }

    // Store the string topics in a local set
    stringTopics.forEach(t => this.stringTopics.add(t));
    // Store the regex topics
    this.regexTopics.push(...regexTopics);

    // Only start consumer.run() once
    if (!this.isConsumerRunning) {
      this.isConsumerRunning = true;

      await this.consumer.run({
        autoCommit: false,
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;
          if (!message.value) return;

          // Check if the topic is one of our subscribed strings
          // or matches any of our regex patterns
          const isStringMatch = this.stringTopics.has(topic);
          const isRegexMatch = this.regexTopics.some(r => r.test(topic));
          if (!isStringMatch && !isRegexMatch) {
            // Not a subscribed topic/pattern; skip
            return;
          }

          try {
            const parsedMessage = JSON.parse(message.value.toString()) as CloudEvent<T>;
            this.logger.info({ topic, partition, message: parsedMessage }, 'Received Kafka message');

            // Process the message
            await handler(parsedMessage);

            // Commit offset manually
            await this.consumer.commitOffsets([
              {
                topic,
                partition,
                offset: (BigInt(message.offset) + BigInt(1)).toString(),
              },
            ]);

            this.logger.info({ topic, partition, messageId: parsedMessage.id }, 'Kafka message processed and committed');
          } catch (error) {
            this.logger.error({ error, topic }, 'Error processing Kafka message');
          }
        },
      });
    }
  }

  /**
   * Gracefully close producer and consumer.
   */
  async close(): Promise<void> {
    if (this.isProducerConnected) {
      await this.producer.disconnect();
      this.isProducerConnected = false;
      this.logger.info({}, 'Kafka producer disconnected');
    }
    if (this.isConsumerConnected) {
      await this.consumer.disconnect();
      this.isConsumerConnected = false;
      this.logger.info({}, 'Kafka consumer disconnected');
    }
  }
}
