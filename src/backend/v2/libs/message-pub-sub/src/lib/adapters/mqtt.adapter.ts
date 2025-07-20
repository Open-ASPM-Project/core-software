import { IMessagePubSub, CloudEvent } from '../message-pub-sub.interface';
import {
  connect,
  MqttClient,
  IClientOptions,
  ISubscriptionGrant,
  IClientSubscribeOptions,
} from 'mqtt';
import { PinoLogger } from 'nestjs-pino';

/**
 * MQTT adapter that supports multiple string topics directly
 * plus any number of RegExp topics by subscribing to '#' if needed.
 */
export class MqttPubSubAdapter implements IMessagePubSub {
  private readonly client: MqttClient;
  private isConnected = false;

  // Keep track of subscribed string topics
  private readonly stringTopics: Set<string> = new Set();
  // Keep track of regex patterns
  private readonly regexTopics: RegExp[] = [];
  // Whether we have subscribed to '#' yet
  private readonly isUniversalSubscribed = false;

  constructor(
    private readonly brokerUrl: string,
    private readonly options: IClientOptions = {},
    private readonly logger?: PinoLogger
  ) {
    this.logger ??= new PinoLogger({ renameContext: MqttPubSubAdapter.name });

    this.client = connect(this.brokerUrl, this.options);

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger?.info(`Connected to MQTT broker at ${this.brokerUrl}`);
    });

    this.client.on('error', (err: Error) => {
      this.logger?.error({ err }, 'MQTT client error');
    });

    // Unified message handler: we check the topic against
    // subscribed strings and any regex patterns we have.
    this.client.on(
      'message',
      async (receivedTopic: string, payload: Buffer) => {
        // Check if this message matches any string topic or regex topic
        const isStringMatch = this.stringTopics.has(receivedTopic);
        const isRegexMatch = this.regexTopics.some((r) =>
          r.test(receivedTopic)
        );

        // If it doesn't match, we do nothing
        if (!isStringMatch && !isRegexMatch) return;

        // Otherwise, parse and handle
        try {
          const parsedMessage: CloudEvent<any> = JSON.parse(payload.toString());
          this.logger?.info(
            { topic: receivedTopic, message: parsedMessage },
            'Received MQTT message that matched a subscription'
          );

          // Because the interface only provides one handler at a time,
          // we stored the handler from the last call. See notes below if you need multiple.
          if (this.currentHandler) {
            await this.currentHandler(parsedMessage);
          }
        } catch (error: unknown) {
          this.logger?.error(
            { error, receivedTopic },
            'Error processing MQTT message'
          );
        }
      }
    );
  }

  /**
   * Publish a CloudEvent message to an MQTT topic.
   */
  async sendMessage<T>(topic: string, message: CloudEvent<T>): Promise<void> {
    if (!topic) {
      throw new Error('Topic is required for MQTT message publishing');
    }

    if (!this.isConnected) {
      throw new Error('MQTT client is not connected yet');
    }

    return new Promise<void>((resolve, reject) => {
      const payload: string = JSON.stringify(message);

      this.client.publish(topic, payload, (err?: Error) => {
        if (err) {
          this.logger?.error({ err, topic }, 'Error publishing MQTT message');
          return reject(
            new Error(`Failed to publish MQTT message to topic: ${topic}`)
          );
        }
        this.logger?.info(
          { topic, messageId: message.id },
          'Message published to MQTT'
        );
        resolve();
      });
    });
  }

  private currentHandler?: (msg: CloudEvent<any>) => Promise<void>;

  /**
   * Subscribe to multiple topics (string | RegExp).
   *
   * - We subscribe directly to all string topics.
   * - If there is ANY regex in the list, we also subscribe once to `#`
   *   (catches everything) and filter by regex in the `on('message')` callback.
   */
  async receiveMessage<T>(
    options: { topics: string[] },
    handler: (msg: CloudEvent<T>) => Promise<void>
  ): Promise<void> {
    if (!options.topics || options.topics.length === 0) {
      throw new Error(
        'At least one topic (string or RegExp) is required for MQTT subscription'
      );
    }

    if (!this.isConnected) {
      throw new Error('MQTT client is not connected yet');
    }

    // Save the user's handler in a property so we can call it from the unified 'message' listener
    this.currentHandler = handler as (msg: CloudEvent<any>) => Promise<void>;

    // Subscribe to all string topics
    if (options.topics.length > 0) {
      const subscribeOptions: IClientSubscribeOptions = {
        qos: 0,
      };
      options.topics.forEach((st) => this.stringTopics.add(st)); // store them
      this.logger?.info(
        { topics: options.topics },
        'Subscribing to MQTT string topics'
      );

      // We can subscribe to them in one call or individually:
      this.client.subscribe(
        options.topics,
        subscribeOptions,
        (err?: Error | null, granted?: ISubscriptionGrant[]) => {
          if (err) {
            this.logger?.error(
              { err, topicss: options.topics },
              'Error subscribing to MQTT topics'
            );
          } else {
            this.logger?.info(
              { granted },
              'Successfully subscribed to MQTT topics'
            );
          }
        }
      );
    }
  }

  /**
   * Gracefully close the MQTT client connection.
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      this.client.end(false, {}, () => {
        this.logger?.info('MQTT client disconnected');
      });
      this.isConnected = false;
    }
  }
}
