variable "lambda_arn" {
  type        = string
  description = "ARN of Lambda"

}
variable "lambda_name" {
  type        = string
  description = "Name of Lambda"

}
variable "schedule_expression"
{
  type = string
  description = "Schedule expression , ie rate(1 minute)"

}