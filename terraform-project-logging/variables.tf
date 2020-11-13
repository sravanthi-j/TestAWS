variable "module_version" {
  type        = string
  description = "Version of the current module"
}

variable "module_name" {
  type        = string
  description = "Name of the current module"
}

variable "environment" {
  type = string
}

variable "project" {
  type = string
}

variable "elastic_cognito_user_pool_id" {
  type = string

}
variable "elastic_cognito_identity_pool_id" {
  type = string

}
variable "elastic_cognito_iam_role_arn" {
  type = string
  description = "(Required) ARN of the IAM role that has the AmazonESCognitoAccess policy attached"
}