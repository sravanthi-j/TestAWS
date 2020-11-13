

module "lambda-es" {
  source      = "https://s3-eu-west-1.amazonaws.com/hilti-infra-public/shared-artifacts/terraform-modules/lambda/0.1.0-master.zip"
  project     = var.project_name
  name        = var.lambda_name
  environment = var.environment
  tags        = local.tags
  logs_retention_days = 1

  lambda_variables = merge(var.lambda_variables, {
    ENVIRONMENT       = var.environment
    CLOUDWATCH_PREFIX = "https://eu-west-1.console.aws.amazon.com/cloudwatch/home?region=eu-west-1#"
    es_endpoint       = var.elasticsearch_endpoint
  })


}

resource "aws_iam_role_policy_attachment" "cloudwatch-to-es" {

  role       = module.lambda-es.iam_role_name
  policy_arn = aws_iam_policy.lambda-elasticsearch-access[0].arn

}

resource "aws_iam_policy" "lambda-elasticsearch-access" {
  count = 1
  name        = "${module.lambda-es.name_full}-elasticsearch-access"
  description = "Allows ${module.lambda-es.name_full} to access elastic"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
          "es:*"
      ],
      "Effect": "Allow",
      "Resource": "${var.elasticsearch_arn}/*"
    },
    {
      "Action": [
        "ec2:DescribeNetworkInterfaces",
        "ec2:CreateNetworkInterface",
        "ec2:DeleteNetworkInterface"
      ],
      "Resource": "*",
      "Effect": "Allow"
    }
  ]
}
EOF
}



output "lambda-es" {
  value =  {
    name                               = local.name
    lambda_full_name = module.lambda-es.name_full
    arn = module.lambda-es.lambda_arn
  }
}