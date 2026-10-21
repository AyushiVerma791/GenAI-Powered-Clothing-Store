output "alb_dns_name" {
  description = "The public DNS domain of the Application Load Balancer"
  value       = aws_lb.api.dns_name
}

output "ecr_repository_url" {
  description = "URL of the Amazon ECR Docker repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution for the React frontend"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_s3_bucket" {
  description = "S3 bucket name hosting the React frontend build artifacts"
  value       = aws_s3_bucket.frontend.id
}

output "media_s3_bucket" {
  description = "S3 bucket name storing customer product media assets"
  value       = aws_s3_bucket.media.id
}
