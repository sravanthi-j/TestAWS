locals {
  tags = merge(local.tags_common, {
    format(local.shared_tag, "extras/terraform-module/${var.module_name}/version") = var.module_version

    format(local.shared_tag, "terraform-module") = var.module_name
    format(local.shared_tag, "project")          = var.project
  })
}
