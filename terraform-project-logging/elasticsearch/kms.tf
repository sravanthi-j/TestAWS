resource "aws_kms_key" "this" {
  count = var.create ? 1 : 0

  description             = "${local.name_full} elasticsearch"
  deletion_window_in_days = 7

  tags = local.tags
}
