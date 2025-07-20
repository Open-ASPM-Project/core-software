import * as amqplib from 'amqplib';
import { Connection, Channel } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { IMessagePubSub, CloudEvent } from '../message-pub-sub.interface';

export class RabbitMqPubSubAdapter implements IMessagePubSub {
  private connection?: Connection;
  private readonly consumers: Map<string, { channel: Channel; queue: string }> =
    new Map();
  private isConnected = false;
  private readonly isConsuming = false;

  // Current handler for incoming messages
  // private currentHandler?: (msg: CloudEvent<any>) => Promise<void>;

  /**
   * @param brokerUrl    AMQP connection URL (e.g., "amqp://localhost")
   * @param logger       Optional PinoLogger
   * @param exchangeName The name of the "topic" exchange to use
   * @param queueName    The queue name to bind; if empty, we'll create a unique queue
   */
  constructor(
    private readonly brokerUrl: string,
    private readonly logger?: PinoLogger,
    private readonly exchangeName = 'nest-pubsub-exchange',
    private readonly queueName?: string,
    private readonly prefetchCount = 1
  ) {
    this.logger ??= new PinoLogger({
      renameContext: RabbitMqPubSubAdapter.name,
    });
  }

  /**
   * Connect to RabbitMQ if not already connected. Lazy initialization.
   */
  private async connectIfNeeded(exchangeName?: string): Promise<void> {
    if (this.isConnected) return;

    this.logger?.info(`Connecting to RabbitMQ at ${this.brokerUrl}...`);
    this.connection = await amqplib.connect(this.brokerUrl);

    const channel = await this.connection.createChannel();

    // Assert the exchange to ensure it exists
    const exchange = exchangeName ?? this.exchangeName;
    await channel.assertExchange(exchange, 'topic', { durable: true });

    this.isConnected = true;
    this.logger?.info(
      `RabbitMQ connected; topic exchange "${
        exchangeName ?? this.exchangeName
      }" asserted`
    );
  }

  /**
   * Publish a message to the RabbitMQ topic exchange, using the "topic" as the routing key.
   */
  async sendMessage<T>(
    topic: string,
    message: CloudEvent<T>,
    exchangeName?: string,
    queueName?: string
  ): Promise<void> {
    if (!topic) {
      throw new Error(
        'Topic (routing key) is required for RabbitMQ message publishing'
      );
    }

    await this.connectIfNeeded();
    const channel = await this.connection?.createChannel();
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const payload = Buffer.from(JSON.stringify(message));
    const publishOk = channel.publish(
      exchangeName ?? this.exchangeName,
      topic,
      payload,
      {
        persistent: true, // Consider persistent messages for reliability
      }
    );

    if (!publishOk) {
      this.logger?.warn(
        { topic },
        'RabbitMQ internal buffer is full; message not fully sent yet.'
      );
    }
    this.logger?.info(
      {
        topic,
        messageId: message.id,
        exchange: exchangeName ?? this.exchangeName,
        queue: queueName ?? this.queueName,
      },
      'Message published to RabbitMQ'
    );
  }

  /**
   * Subscribe to multiple string topics. We:
   *  - Create (or re-use) a queue.
   *  - Bind that queue to each string topic (routing key).
   *  - Consume from the queue if not already consuming.
   */
  async receiveMessage<T>(
    options: {
      topics: string[];
      exchangeName?: string;
      queueName?: string;
      prefetchCount?: number;
    },
    handler: (msg: CloudEvent<T>) => Promise<void>
  ): Promise<void> {
    await this.connectIfNeeded();
    if (!this.connection) {
      throw new Error('RabbitMQ connection not available');
    }

    // Create a new channel for this consumer
    const channel = await this.connection.createChannel();

    // Set prefetch count to process messages concurrently
    channel.prefetch(options.prefetchCount ?? this.prefetchCount);

    // Create a unique queue for this consumer
    options.topics.sort((a, b) => a.localeCompare(b));
    const consumerKey = options.topics.join('-');
    const queueName = options.queueName ?? this.queueName ?? '';

    const assertedQueue = await channel.assertQueue(queueName, {
      durable: true,
      exclusive: !this.queueName, // Exclusive if no specific queue name provided
    });
    const queue = assertedQueue.queue;

    // Bind each topic to this consumer's queue
    for (const topic of options.topics) {
      await channel.bindQueue(
        queue,
        options.exchangeName ?? this.exchangeName,
        topic
      );
      this.logger?.info({ topic, queue }, 'Bound topic to queue');
    }

    // Start consuming on this channel
    await channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        try {
          const parsed = JSON.parse(msg.content.toString()) as CloudEvent<T>;
          this.logger?.info(
            { routingKey: msg.fields.routingKey, queue },
            'Processing message'
          );

          await handler(parsed);
          channel.ack(msg);
        } catch (error) {
          this.logger?.error(
            { error, routingKey: msg.fields.routingKey, queue },
            'Error processing message'
          );
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );

    // Store the consumer details
    this.consumers.set(consumerKey, { channel, queue });

    this.logger?.info(
      { topics: options.topics, queue },
      'Started new consumer'
    );
  }

  /**
   * Close the RabbitMQ channel & connection if open.
   */
  async close(): Promise<void> {
    try {
      // Close all consumer channels
      for (const [key, consumer] of this.consumers) {
        await consumer.channel.close();
        this.logger?.info({ queue: consumer.queue }, 'Closed consumer channel');
        this.consumers.delete(key);
      }

      if (this.connection) {
        await this.connection.close();
        this.logger?.info('RabbitMQ connection closed');
      }
    } catch (err) {
      this.logger?.error({ err }, 'Error closing RabbitMQ connections');
    }

    this.isConnected = false;
  }
}
