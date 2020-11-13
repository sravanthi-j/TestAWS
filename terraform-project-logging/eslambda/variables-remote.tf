variable "module_prefix" {
  type        = string
  description = "Common resource name prefix"

  default = null
}

locals {
  module_prefix = element(concat(data.terraform_remote_state.base[*].outputs.module_prefix, [var.module_prefix]), 0)
}

variable "aws_region" {
  type        = string
  description = "AWS region"

  default = null
}

locals {
  aws_region = element(concat(data.terraform_remote_state.base[*].outputs.aws_region, [var.aws_region]), 0)
}

variable "env" {
  type        = object({is_prod=bool})
  description = "Current environment configuration map"

  default = null
}

locals {
  env = element(concat(data.terraform_remote_state.base[*].outputs.env, [var.env]), 0)
}

variable "shared_tag" {
  type        = string
  description = "Common tag prefix for ASWU resources"

  default = null
}

locals {
  shared_tag = element(concat(data.terraform_remote_state.base[*].outputs.shared_tag, [var.shared_tag]), 0)
}

variable "vpc_id" {
  type        = string
  description = "VPC id of subnets"

  default = null
}

locals {
  vpc_id = element(concat(data.terraform_remote_state.base[*].outputs.vpc_id, [var.vpc_id]), 0)
}

variable "vpc_subnets" {
  type        = list(string)
  description = "VPC subnets for instances"

  default = null
}

locals {
  vpc_subnets = element(concat(data.terraform_remote_state.base[*].outputs.vpc_subnets, [var.vpc_subnets]), 0)
}

variable "vpc_subnets_cidrs" {
  type        = list(string)
  description = "VPC subnets CIDRs for instances"

  default = null
}

locals {
  vpc_subnets_cidrs = element(concat(data.terraform_remote_state.base[*].outputs.vpc_subnets_cidrs, [
    var.vpc_subnets_cidrs]), 0)
}
