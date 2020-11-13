data "terraform_remote_state" "base" {
  backend = "s3"
  config = {
    bucket  = "[TERRAFORM_BUCKET]"
    key     = "terraform/base"
    region  = "[TERRAFORM_REGION]"
    profile = "default"
  }
}


locals {

  tags_common         = data.terraform_remote_state.base.outputs.tags_common
  shared_tag          = data.terraform_remote_state.base.outputs.shared_tag
  module_prefix       = data.terraform_remote_state.base.outputs.module_prefix
  common_tags         = data.terraform_remote_state.base.outputs.common_tags
  aws_region          = data.terraform_remote_state.base.outputs.aws_region
  dns_services_suffix = data.terraform_remote_state.base.outputs.dns_services_suffix
  stub_ecr_repo       = data.terraform_remote_state.base.outputs.stub_ecr_repo
  oag_available       = data.terraform_remote_state.base.outputs.oag_available
  oag_host            = data.terraform_remote_state.base.outputs.oag_host
  oag_endpoint        = data.terraform_remote_state.base.outputs.oag_endpoint
  account_id          = data.terraform_remote_state.base.outputs.account_id
  dns_main_suffix     = data.terraform_remote_state.base.outputs.dns_main_suffix
  dns_main_zone       = data.terraform_remote_state.base.outputs.dns_main_zone

}
