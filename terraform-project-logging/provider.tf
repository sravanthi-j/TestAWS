provider "aws" {
  region  = "[TERRAFORM_REGION]"
  profile = "default"
  version = "~> 2.66.0"
}

provider "aws" {
  alias      = "arch"
  region     = "[TERRAFORM_REGION]"
  version    = "~> 2.66.0"
  access_key = "[ARCH_ACCESS_USER]"
  secret_key = "[ARCH_ACCESS_KEY]"
}

provider "aws" {
  alias      = "route53"
  region     = "[TERRAFORM_REGION]"
  version    = "~> 2.66.0"
  access_key = "[ROUTE53_ACCESS_USER]"
  secret_key = "[ROUTE53_ACCESS_KEY]"
}

provider "null" {
  version = "~> 2.1.0"
}

provider "archive" {
  version = "~> 1.2.0"
}

provider "template" {
  version = "~> 2.1.0"
}

provider "random" {
  version = "~> 2.1.0"
}

provider "tls" {
  version = "~> 2.0.0"
}

terraform {
  required_version = "~> 0.12.1"

  backend "s3" {
    bucket         = "[TERRAFORM_BUCKET]"
    key            = "terraform/project-[TERRAFORM_PROJECT]"
    region         = "[TERRAFORM_REGION]"
    profile        = "default"
    dynamodb_table = "hilti-infra-terraform"
  }
}
