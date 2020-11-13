locals {
  # Service name grouping set of modules
  service = var.service != null ? var.service : var.name

  # Shared name of this module. Should be used as a prefix for submodules
  name = var.service != null ? "${var.service}-${var.name}" : var.name

  # Full module name with all prefixes (to be used as resource names)
  name_full = "${local.module_prefix}${var.project}-${local.name}"

  # Map of tags that should be used by submodules
  tags_common = merge(var.tags, {
    format(local.shared_tag, "extras/terraform-module/${var.module_name}/version") = var.module_version
  })

  # Map of tags used for resources created by this module
  tags = merge(local.tags_common, {
    format(local.shared_tag, "terraform-module") = var.module_name
    format(local.shared_tag, "service")          = local.service
    format(local.shared_tag, "role")             = "Elasticache instance"
  })

  # For resources with limited amount of tags allowed (e.g. S3 objects)
  tags_short = {for k, v in local.tags : k => v if replace(k, format(local.shared_tag, "extras/"), "") == k}
}
