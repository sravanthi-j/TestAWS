resource "aws_cloudwatch_event_rule" "timer_rule" {
  name                = "lambda-timer-${var.lambda_name}"
  description         = "Timer for ${var.lambda_name}"
  schedule_expression = var.schedule_expression
}
resource "aws_cloudwatch_event_target" "check_foo_every_one_minute" {
  rule      = aws_cloudwatch_event_rule.timer_rule.name
  target_id = "lambda"
  arn       = var.lambda_arn
}
resource "aws_lambda_permission" "allow_cloudwatch_to_call_check_foo" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.timer_rule.arn

}