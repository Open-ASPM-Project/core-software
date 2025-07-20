import { Module } from '@nestjs/common';
import { AssetWorker } from './asset.worker';
import { AssetWorkerController } from './asset.worker.controller';
import { defaultModuleImports } from '@firewall-backend/utils';
import { MessagePubSubModule } from '@firewall-backend/message-pub-sub';
import { AssetsModule } from '../assets/assets.module';
import { AssetWorkerService } from './asset.worker.service';
import { SourcesModule } from '../sources/sources.module';
import { ConfigurationModule } from '@firewall-backend/configuration';

@Module({
  imports: [
    ...defaultModuleImports(),
    MessagePubSubModule.forRoot({
      adapter: 'rabbitmq',
      rabbitUrl: process.env.RABBITMQ_URL,
      rabbitExchange: 'asset-exchange',
      rabbitQueueName: 'asset-queue',
    }),
    AssetsModule,
    SourcesModule,
    ConfigurationModule,
  ],
  controllers: [AssetWorkerController],
  providers: [AssetWorker, AssetWorkerService],
})
export class AssetWorkerModule {}
