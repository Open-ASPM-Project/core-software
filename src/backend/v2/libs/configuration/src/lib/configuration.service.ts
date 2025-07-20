import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateConfigurationDto,
  UpdateConfigurationDto,
} from './dtos/configuration.dto';
import {
  DEFAULT_CONFIG_UUID,
  DEFAULT_CRAWLER_CONFIG_UUID,
  DEFAULT_DAST_CONFIG_UUID,
  DEFAULT_FORM_CONFIG_UUID,
  DEFAULT_TECH_CONFIG_UUID,
} from '@firewall-backend/constants';
import { Configuration } from '@firewall-backend/entities';

@Injectable()
export class ConfigurationService implements OnModuleInit {
  constructor(
    @InjectRepository(Configuration)
    private readonly configRepository: Repository<Configuration>
  ) {}

  async onModuleInit() {
    await this.ensureDefaultConfigs();
  }

  async ensureDefaultConfigs(): Promise<void> {
    const presets = [
      {
        uuid: DEFAULT_CONFIG_UUID,
        name: 'firewall default',
        config: {
          silent: true,
          'exclude-file': 'exclude.txt',
          'interactsh-server': 'oast.site',
          severity: ['critical', 'high', 'medium', 'low', 'unknown'],
          'exclude-severity': [],
          'exclude-matchers': [],
          'rate-limit': 150,
          'bulk-size': 25,
          concurrency: 25,
          timeout: 15,
          retries: 3,
          proxy: null,
          'no-mhe': true,
          code: true,
          headless: true,
        },
      },
      {
        uuid: DEFAULT_DAST_CONFIG_UUID,
        name: 'firewall dast default',
        config: {
          silent: true,
          'exclude-file': 'exclude.txt',
          'interactsh-server': 'oast.site',
          severity: ['critical', 'high', 'medium', 'low'],
          'exclude-severity': [],
          'exclude-matchers': [],
          'rate-limit': 30,
          'bulk-size': 25,
          concurrency: 25,
          timeout: 15,
          retries: 3,
          proxy: null,
          'no-mhe': true,
          code: true,
          headless: true,
          dast: true,
        },
      },
      {
        uuid: DEFAULT_TECH_CONFIG_UUID,
        name: 'firewall tech default',
        config: {
          silent: true,
          'exclude-file': 'exclude.txt',
          'interactsh-server': 'oast.site',
          severity: ['critical', 'high', 'medium', 'low', 'unknown', 'info'],
          'exclude-severity': [],
          'exclude-matchers': [],
          'rate-limit': 150,
          'bulk-size': 25,
          concurrency: 25,
          timeout: 15,
          retries: 3,
          proxy: null,
          'no-mhe': true,
          code: true,
          headless: true,
        },
      },
      {
        uuid: DEFAULT_CRAWLER_CONFIG_UUID,
        name: 'firewall katana crawler default',
        config: {
          resolvers: ['1.1.1.1', '8.8.8.8', '8.8.4.4'],
          headless: false,
          'field-scope': 'fqdn',
          'js-crawl': true,
          'crawl-duration': '45m',
          'known-files': 'all',
          timeout: 10,
          retry: 1,
          'automatic-form-fill': true,
          'form-extraction': true,
          'extension-filter': [
            'css',
            'png',
            'jpg',
            'woff',
            'ttf',
            'ico',
            'jpeg',
            'svg',
          ],
          silent: true,
          headers: ['TheFirewallProject: v1'],
          'ignore-query-params': false,
          concurrency: 10,
          parallelism: 10,
          'rate-limit': 150,
          'disable-update-check': true,
          jsonl: true,
          'no-color': true,
        },
      },
      {
        uuid: DEFAULT_FORM_CONFIG_UUID,
        name: 'firewall katana form default',
        config: {
          name: 'thefirewalltestname',
          displayname: 'thefirewalltestname',
          display_name: 'thefirewalltestname',
          full_name: 'thefirewalltestname',
          first_name: 'thefirewallfirstname',
          last_name: 'thefirewalllastname',
          nickname: 'thefirewallnickname',

          user: 'tfuser',
          username: 'tfuser',
          user_name: 'tfuser',

          pass: 'tfpassw0rd@123',
          pwd: 'tfpassw0rd@123',
          passwd: 'tfpassw0rd@123',
          password: 'tfpassw0rd@123',
          old_password: 'tfpassw0rd@123',
          new_password: 'tfpassw0rd@1234',

          email: 'tfuser@thefirewall.org',
          email_address: 'tfuser@thefirewall.org',
          user_email: 'tfuser@thefirewall.org',

          phone: '9876543210',
          phone_no: '9876543210',
          phone_number: '9876543210',
          mobile: '9876543210',
          mobile_no: '9876543210',
          mobile_number: '9876543210',
          tel: '9876543210',
          telephone_no: '9876543210',
          telephone_number: '9876543210',

          organization: 'TheTFOrg',
          org: 'TheTFOrg',
          company: 'TheTFOrg',
          employer: 'TheTFOrg',

          job: 'Engineer',
          job_title: 'Engineer',
          occupation: 'Engineer',
          position: 'Engineer',
        },
      },
    ];

    for (const preset of presets) {
      const exists = await this.configRepository.findOne({
        where: { uuid: preset.uuid },
      });
      if (!exists) {
        const configEntity = this.configRepository.create({
          uuid: preset.uuid,
          name: preset.name,
          config: preset.config,
        });
        await this.configRepository.save(configEntity);
      }
    }
  }

  async create(createDto: CreateConfigurationDto): Promise<Configuration> {
    const config = this.configRepository.create(createDto);
    return this.configRepository.save(config);
  }

  async findAll(name?: string): Promise<Configuration[]> {
    if (name) {
      return this.configRepository.find({ where: { name } });
    }
    return this.configRepository.find();
  }

  async findOne(uuid: string): Promise<Configuration> {
    const config = await this.configRepository.findOne({ where: { uuid } });
    if (!config) {
      throw new NotFoundException(`Configuration with id=${uuid} not found`);
    }
    return config;
  }

  async findOneById(id: number): Promise<Configuration> {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Configuration with id=${id} not found`);
    }
    return config;
  }

  async updateOne(
    uuid: string,
    updateDto: UpdateConfigurationDto
  ): Promise<Configuration> {
    const config = await this.findOne(uuid);
    Object.assign(config, updateDto);
    return this.configRepository.save(config);
  }

  async remove(uuid: string): Promise<void> {
    const config = await this.findOne(uuid);
    await this.configRepository.remove(config);
  }
}
