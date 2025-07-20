import { Injectable, Inject } from '@nestjs/common';
import {
  IMessagePubSub,
  CloudEvent,
  PubSubTopicsOptions,
} from './message-pub-sub.interface';

export const MESSAGE_PUBSUB_ADAPTER = 'MESSAGE_PUBSUB_ADAPTER';

@Injectable()
export class MessagePubSubService implements IMessagePubSub {
  constructor(
    @Inject(MESSAGE_PUBSUB_ADAPTER)
    private readonly adapter: IMessagePubSub
  ) {}

  async sendMessage<T>(
    topic: string,
    message: CloudEvent<T>,
    exchangeName?: string,
    queueName?: string
  ): Promise<void> {
    return this.adapter.sendMessage(topic, message, exchangeName, queueName);
  }

  async receiveMessage<T>(
    options: PubSubTopicsOptions,
    handler: (msg: CloudEvent<T>) => Promise<void>
  ): Promise<void> {
    return this.adapter.receiveMessage(options, handler);
  }
}
