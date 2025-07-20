import { IsString } from "class-validator";

export class CreateAWSCloudDto {
  @IsString()
  awsAccessKey: string;

  @IsString()
  awsSecretKey: string;
}

export class CreateGCPCloudDto {
  @IsString()
  gcpServiceAccountKey: string;
}

export class CreateAzureCloudDto {
  @IsString()
  clientId: string;

  @IsString()
  clientSecret: string;

  @IsString()
  tenantId: string;

  @IsString()
  subscriptionId: string;
}

export class CreateDigitalOceanCloudDto {
  @IsString()
  digitaloceanToken: string;
}

export class CreateScalewayCloudDto {
  @IsString()
  scalewayAccessKey: string;

  @IsString()
  scalewayAccessToken: string;
}

export class CreateArvanCloudDto {
  @IsString()
  apiKey: string;
}

export class CreateCloudflareCloudDto {
  @IsString()
  email: string;

  @IsString()
  apiKey: string;
}

export class CreateHerokuCloudDto {
  @IsString()
  herokuApiToken: string;
}

export class CreateFastlyCloudDto {
  @IsString()
  fastlyApiKey: string;
}

export class CreateLinodeCloudDto {
  @IsString()
  linodePersonalAccessToken: string;
}

export class CreateNamecheapCloudDto {
  @IsString()
  namecheapApiKey: string;

  @IsString()
  namecheapUserName: string;
}

export class CreateAlibabaCloudDto {
  @IsString()
  alibabaRegionId: string;

  @IsString()
  alibabaAccessKey: string;

  @IsString()
  alibabaAccessKeySecret: string;
}

export class CreateTerraformCloudDto {
  @IsString()
  tfStateFile: string;
}

export class CreateConsulCloudDto {
  @IsString()
  consulUrl: string;
}

export class CreateNomadCloudDto {
  @IsString()
  nomadUrl: string;
}

export class CreateHetznerCloudDto {
  @IsString()
  authToken: string;
}

export class CreateKubernetesCloudDto {
  @IsString()
  kubeconfigFile: string;

  @IsString()
  kubeconfigEncoded: string;
}

export class CreateDNSSimpleCloudDto {
  @IsString()
  dnssimpleApiToken: string;
}
