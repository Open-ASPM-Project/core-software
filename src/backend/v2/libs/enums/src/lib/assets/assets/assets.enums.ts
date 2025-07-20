export enum IpType {
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
}

export enum AssetType {
  WEBAPP = 'webapp',
  WEBAPP_API = 'webapp_api',
  IP = 'ip',
  DOMAIN = 'domain',
  SUBDOMAIN = 'subdomain',
  SERVICE = 'service',
  UNKNOWN = 'unknown',
}

export enum AssetSubType {
  AWS_VPC_SECURITY_GROUP = 'aws_vpc_security_group',
  AWS_EC2_INSTANCE = 'aws_ec2_instance',
  AWS_EC2_APPLICATION_LOAD_BALANCER = 'aws_ec2_application_load_balancer',
  AWS_EC2_CLASSIC_LOAD_BALANCER = 'aws_ec2_classic_load_balancer',
  AWS_EC2_GATEWAY_LOAD_BALANCER = 'aws_ec2_gateway_load_balancer',
  AWS_RDS_DB_INSTANCE = 'aws_rds_db_instance',
  AWS_ROUTE53_RECORD = 'aws_route53_record',
  AWS_S3_BUCKET = 'aws_s3_bucket',
  AWS_API_GATEWAY_REST_API = 'aws_api_gateway_rest_api',
  AWS_API_GATEWAY_STAGE = 'aws_api_gateway_stage',
}

export enum AwsServiceAssetType {
  AWS_VPC_SECURITY_GROUP = 'aws_vpc_security_group',
  AWS_EC2_INSTANCE = 'aws_ec2_instance',
  AWS_EC2_APPLICATION_LOAD_BALANCER = 'aws_ec2_application_load_balancer',
  AWS_EC2_CLASSIC_LOAD_BALANCER = 'aws_ec2_classic_load_balancer',
  AWS_EC2_GATEWAY_LOAD_BALANCER = 'aws_ec2_gateway_load_balancer',
  AWS_RDS_DB_INSTANCE = 'aws_rds_db_instance',
  AWS_ROUTE53_RECORD = 'aws_route53_record',
  AWS_S3_BUCKET = 'aws_s3_bucket',
  AWS_API_GATEWAY_REST_API = 'aws_api_gateway_rest_api',
  AWS_API_GATEWAY_STAGE = 'aws_api_gateway_stage',
}
