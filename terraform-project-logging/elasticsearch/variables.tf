variable "create" {
  type        = bool
  description = "If we want to create module resources"

  default = true
}

variable "module_version" {
  type        = string
  description = "Version of the current module"

  default = "[MODULE_VERSION]"
}

variable "module_name" {
  type        = string
  description = "Name of the current module"

  default = "[MODULE_NAME]"
}


variable "project" {
  type        = string
  description = "Project name"
}

variable "service" {
  type        = string
  description = "Service name. \"name\" field is used if omitted"

  default = null
}

variable "name" {
  type        = string
  description = "Resource name. If service parameter is used, it is added as a prefix"
}

variable "environment" {
  type        = string
  description = "Environment name"
}

variable "tags" {
  type        = map(string)
  description = "Map of common tags for all resources"

  default = {}
}

variable "use_remote_state" {
  type        = bool
  description = "If we need to use remote terraform-infra-base state"

  default = true
}

variable "cluster_version" {
  type        = string
  description = "Elasticsearch cluster version"

  default = "7.7"
}

variable "cluster_count" {
  type        = number
  description = "Amount of elasticsearch instances"

  default = 2
}

variable "cluster_volume_size" {
  type        = number
  description = "Instance volume size in gigabytes"

  default = 100
}

variable "cluster_encryption_at_rest" {
  type        = bool
  description = "If encryption at rest should be enabled"

  default = true
}

variable "cluster_type" {
  type        = string
  description = "Cluster instance type"

  default = "m4.large.elasticsearch"
}

variable "cognito_user_pool_id" {
  type = string

}
variable "cognito_identity_pool_id" {
  type = string

}
variable "cognito_iam_role_arn" {
  type = string
  description = "(Required) ARN of the IAM role that has the AmazonESCognitoAccess policy attached"
}