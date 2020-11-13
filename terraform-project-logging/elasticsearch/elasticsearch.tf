resource "aws_elasticsearch_domain" "this" {
  count = var.create ? 1 : 0

  domain_name           = local.name_full
  elasticsearch_version = var.cluster_version

  cluster_config {
    instance_type          = var.cluster_type
    instance_count         = var.cluster_count
    zone_awareness_enabled = true
  }

  vpc_options {
    security_group_ids = [aws_security_group.this[0].id]
    subnet_ids         = slice(local.vpc_subnets, 0, var.cluster_count)
  }

  advanced_options = {
    "rest.action.multi.allow_explicit_index" = "true"
  }

  ebs_options {
    ebs_enabled = true
    volume_size = var.cluster_volume_size
  }

  encrypt_at_rest {
    enabled    = var.cluster_encryption_at_rest
    kms_key_id = var.cluster_encryption_at_rest ? aws_kms_key.this[0].arn : ""
  }

  node_to_node_encryption {
    enabled = true
  }

  access_policies = data.aws_iam_policy_document.elasticsearch[0].json


   cognito_options {
       enabled          = true
      user_pool_id     = var.cognito_user_pool_id
      identity_pool_id = var.cognito_identity_pool_id
      role_arn         = var.cognito_iam_role_arn

  }


  snapshot_options {
    automated_snapshot_start_hour = 23
  }

  tags = local.tags
}
