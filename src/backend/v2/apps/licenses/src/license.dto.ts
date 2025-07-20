import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
    @IsString()
    otp: string;

    @IsString()
    license_id: string
  }

export class CreateLicenseDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  hardwareId: string;
}


export class ValidateLicenseDto {
    @IsString()
    licenseKey: string;
  
    @IsString()
    @IsNotEmpty()
    hardwareId: string;
}