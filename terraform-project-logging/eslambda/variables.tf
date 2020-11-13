variable "elasticsearch_arn" {
  type        = string
  description = "ARN of Elasticsearch"

}
variable "service" {
  type        = string
  description = "Service name. \"name\" field is used if omitted"

  default = null
}
variable "tags" {
  type        = map(string)
  description = "Map of common tags for all resources"

  default = {}
}
variable "dns_main_zone" {
  type        = string
  description = "DNS Main Zone"

}
variable "project_name" {
  type = string
}
variable "lambda_name" {
  type = string
}

variable "account_id" {
  type = string
}

variable "environment" {
  type = string
}

variable "use_remote_state" {
  type = bool
  default = 1
}

variable "dns_services_suffix" {
  type = string
}

variable "dns_main_suffix" {
  type = string
}


variable "oag_available" {
  type = string
}

variable "oag_host" {
  type = string
}

variable "oag_endpoint" {
  type = string
}


variable "public_dns" {
  type = string
}

variable "common_tags" {
  type = map
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
variable "elasticsearch_endpoint" {
  type        = string
  description = "The API endpoint of elasticsearch"

}

variable "lambda_variables" {
  type        = map(string)
  description = "Map of lambda environment variables"

  default = {}
}