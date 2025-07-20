// licenses.controller.ts
import { Controller, Post, Body, Get, Query, Param, Response } from '@nestjs/common';
import { LicensesService } from './license.service';
import { License } from './license.entity';
import { CreateLicenseDto, ValidateLicenseDto, VerifyDto } from './license.dto';


@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('request')
  async requestLicense(@Body() createLicenseDto: CreateLicenseDto): Promise<License> {
    return this.licensesService.requestLicense(createLicenseDto);
  }

  @Post('verify')
  async verifyEmail(@Body() param: VerifyDto): Promise<License> {
    return await this.licensesService.verifyEmail(param.otp, param.license_id);
  }

  @Post('validate')
  async validateLicense(@Body() validateDto: ValidateLicenseDto): Promise<{ valid: boolean }> {
    const result = await this.licensesService.validateLicense(validateDto);
    return { valid: result };
  }
}
