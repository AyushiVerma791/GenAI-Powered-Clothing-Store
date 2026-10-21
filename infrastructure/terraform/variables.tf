variable "aws_region" {
  description = "The AWS Region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for AWS resource tagging"
  type        = string
  default     = "clothing-store-ai"
}

variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "production"
}

variable "backend_container_port" {
  description = "Internal container port for FastAPI"
  type        = number
  default     = 8000
}

variable "backend_cpu" {
  description = "Fargate CPU units (256, 512, 1024, etc.)"
  type        = string
  default     = "512"
}

variable "backend_memory" {
  description = "Fargate Memory (1024, 2048, etc.)"
  type        = string
  default     = "1024"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection string URI"
  type        = string
  sensitive   = true
}

variable "groq_api_key" {
  description = "API Key for Groq cloud inference"
  type        = string
  sensitive   = true
}

variable "jwt_secret_key" {
  description = "64-character secret key for signing JWT tokens"
  type        = string
  sensitive   = true
}
