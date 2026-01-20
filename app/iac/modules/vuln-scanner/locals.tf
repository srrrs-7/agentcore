locals {
  name_prefix = "vuln-scanner-${var.environment}"

  common_tags = {
    Project     = "vuln-scanner"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
