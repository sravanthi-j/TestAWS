module "elasticsearch_for_logging"  {
  source = "./elasticsearch"

  cognito_iam_role_arn = var.elastic_cognito_iam_role_arn
  cognito_identity_pool_id = var.elastic_cognito_identity_pool_id
  cognito_user_pool_id = var.elastic_cognito_user_pool_id

  environment = var.environment
  project = var.project
  name = "elastic"

}