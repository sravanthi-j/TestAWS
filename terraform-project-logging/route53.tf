
resource "aws_route53_record" "elasticsearch_for_logging_r53" {

  provider = aws.route53
  zone_id  = local.dns_main_zone
  name     = "eslogs.${local.dns_main_suffix}"
  type     = "CNAME"

  records = [module.elasticsearch_for_logging.endpoint]
  ttl     = "300"
}