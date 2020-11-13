data "terraform_remote_state" "base" {
  count = var.use_remote_state ? 1 : 0

  backend = "s3"
  config  = {
    bucket  = "[TERRAFORM_BUCKET_PREFIX]${var.environment}"
    key     = "terraform/base"
    region  = "[TERRAFORM_REGION]"
    profile = "default"
  }
}

data "aws_iam_policy_document" "elasticsearch" {
  count = var.create ? 1 : 0

  version = "2012-10-17"

  source_json = <<CONFIG
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "es:*",
      "Resource": "arn:aws:es:${local.aws_region}:${local.env.account_id}:domain/${local.name_full}/*"
    }
  ]
}
CONFIG
}
