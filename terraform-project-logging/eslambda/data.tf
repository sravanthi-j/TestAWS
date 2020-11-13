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