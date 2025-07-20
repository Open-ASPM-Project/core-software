// licenses.service.ts
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { License } from './license.entity';
import { CreateLicenseDto, ValidateLicenseDto } from './license.dto';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';


@Injectable()
export class LicensesService {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepo: Repository<License>,
    private readonly configService: ConfigService
  ) {}

  private async isWorkEmail(email: string): Promise<boolean> {
    const publicDomains = new Set([
      "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", 
      "icloud.com", "mail.com", "zoho.com", "gmx.com", "yandex.com", "protonmail.com", "example.com"
    ]);
  
    const domain = email.split("@")[1]?.toLowerCase();
    return domain ? !publicDomains.has(domain) : false;
  }

  public async requestLicense(createLicenseDto: CreateLicenseDto): Promise<License> {
    const now = new Date();
    const { email, hardwareId } = createLicenseDto;
    const existingLicense = await this.licenseRepo.findOne({
      where: { email, hardwareId, active: true },
    });
    const isWorkEmail = await this.isWorkEmail(email);
    
    // Handle existing active license
    if (existingLicense) {
      if (existingLicense.expiresAt > now) {
          return existingLicense; // Still valid, return as is
      } else {
          await this.softDeleteLicense(existingLicense.id); // Soft delete expired license
          if (isWorkEmail) {
              return this.generateLicense(email, hardwareId, 90);
          } else {
              throw new BadRequestException(
                  'Non-work emails can only receive one license.'
              );
          }
      }
    }

    // Check for previous licenses
    const hasHistory = await this.licenseRepo.findOne({
      where: { email },
      withDeleted: true,
    });

    if (isWorkEmail) {
      return this.generateLicense(email, hardwareId, 90);
    } else {
      if (!hasHistory) {
        return this.generateLicense(email, hardwareId, 30);
      } else {
        throw new BadRequestException('Non-work emails can only receive one license.');
      }
    }
  }

  private async generateLicense(
    email: string,
    hardwareId: string,
    days: number,
  ): Promise<License> {
    const expiresInSec = days * 24 * 60 * 60;
      const token = jwt.sign(
      {
        email,
        hardwareId,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: expiresInSec,
      },
    );
  
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSec * 1000);

    // Mark any existing active license as deleted before saving new one
    await this.licenseRepo.update(
      { email, active: true },
      { active: false }  // Soft delete
    );
  
    const newLicense = await this.licenseRepo.save({
      email,
      hardwareId,
      licenseKey: token,            
      expiresAtDays: days,   
      expiresAt,                    
      active: true,
    });

    await this.sendVerificationEmail(email, newLicense.id)
  
    return newLicense;
  }

  public async validateLicense(
    validateDto: ValidateLicenseDto
  ): Promise<boolean> {
    const { licenseKey, hardwareId } = validateDto
    const license = await this.licenseRepo.findOne({
      where: { licenseKey, active: true, verified: true },
    });
    if (!license) return false;
  
    try {
      const decoded = jwt.verify(licenseKey, process.env.SECRET_KEY,);
      // TODO: removing check beacuse of multiple deployment, come up a better approach
      // if (decoded['hardwareId'] !== hardwareId) {
      //   return false;
      // }
      return true;
    } catch (error) {
      await this.softDeleteLicense(license.id);
      return false;
    }
  }

  public async softDeleteLicense(licenseId: string): Promise<void> {
    await this.licenseRepo.softDelete(licenseId);
  }

  public async getAllActiveLicenses(): Promise<License[]> {
    return this.licenseRepo.find({ where: { active: true } });
  }

  public async sendVerificationEmail(email: string, license_id: string): Promise<boolean> {
    try {
      const license = await this.licenseRepo.findOne({ where: { id: license_id, email } });
      if (!license) {
        throw new BadRequestException('License not found');
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      license.otp = otp;
      license.otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await this.licenseRepo.save(license);
      
      const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
      const senderEmail = this.configService.get<string>('EMAIL_USER');

      const emailData = {
        sender: { name: 'The Firewall Support Team', email: senderEmail },
        to: [{ email: email, name: 'User' }],
        subject: 'Action Required: Verify Your Email for License Activation',
        htmlContent: `<p>Dear User,</p>
                      <p>We appreciate your interest in our services. To complete the license activation process, please use the OTP provided below:</p>
                      <p><strong>${otp}</strong></p>
                      <p>If you did not request this, please ignore this email.</p>
                      <p>Best regards,<br>The Firewall Support Team</p>`
      };

      const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  public async verifyEmail(otp: string, license_id: string): Promise<License> {
    try {
      const license = await this.licenseRepo.findOne({ where: { id: license_id, otp } });
      if (!license || !license.otpExpiresAt || license.otpExpiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      license.verified = true;
      await this.licenseRepo.save(license);

      console.log(license)

      return license;
    } catch (error) {
      throw new BadRequestException('Invalid or expired OTP');
    }
  }
}
