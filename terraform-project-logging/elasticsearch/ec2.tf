resource "aws_security_group" "this" {
  count = var.create ? 1 : 0

  vpc_id      = local.vpc_id
  name        = local.name_full
  description = "Allow inbound traffic from Security Groups and CIDRs. Allow all outbound traffic"

  tags = local.tags
}

resource "aws_security_group_rule" "ingress" {
  count = var.create ? 1 : 0

  description = "Allow inbound traffic from CIDR blocks"

  type              = "ingress"
  security_group_id = aws_security_group.this[0].id
  from_port         = 0
  to_port           = 65535
  protocol          = "tcp"

  cidr_blocks = local.vpc_subnets_cidrs
}

resource "aws_security_group_rule" "egress" {
  count = var.create ? 1 : 0

  description = "Allow all egress traffic"

  security_group_id = aws_security_group.this[0].id
  type              = "egress"
  from_port         = 0
  to_port           = 65535
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

