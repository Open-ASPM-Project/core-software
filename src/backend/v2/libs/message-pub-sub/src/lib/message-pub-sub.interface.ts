export interface CloudEvent<T = any> {
  data: T;
  id: string;
  source: string;
  type: string;
  time: Date;
  subject?: string;
  specversion?: '1.0';
  extensions?: Record<string, any>;
}

export type PubSubTopicsOptions = {
  topics: (string | RegExp)[];
  exchangeName?: string;
  queueName?: string;
};

export interface IMessagePubSub {
  sendMessage<T>(
    topic: string,
    message: CloudEvent<T>,
    exchangeName?: string,
    queueName?: string
  ): Promise<void>;
  receiveMessage<T>(
    options: PubSubTopicsOptions,
    handler: (msg: CloudEvent<T>) => Promise<void>
  ): Promise<void>;
}
