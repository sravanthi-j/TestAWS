output "service" {
  value = local.service

  description = "Service name grouping set of modules"
}

output "name" {
  value = local.name

  description = "Shared name of this module"
}

output "name_full" {
  value = local.name_full

  description = "Full module name with all prefixes"
}

output "tags" {
  value = local.tags

  description = "Map of tags for nested module resources"
}

output "tags_common" {
  value = local.tags_common

  description = "Map of common module tags"
}

