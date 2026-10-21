# M.Tech Technical Interview Preparation & Defense Guide

This guide prepares you to confidently discuss, explain, and defend the architecture and implementation of the **GenAI-Powered Clothing Store** during technical interviews for Full-Stack, AI Engineering, and Backend roles.

---

## 1. High-Level Project Pitch (30-Second Elevator Pitch)

> *"For my graduate project, I architected and built a full-stack, cloud-native clothing e-commerce platform integrated with a GenAI shopping assistant named 'Aura'. The backend is built with FastAPI and MongoDB, utilizing Pydantic AI and Groq's LPU inference running Llama 3.3 70B.*
> 
> *Rather than having the LLM hallucinate or dumping our entire catalog into the prompt, the agent uses dynamic, typed function tools with runtime dependency injection to retrieve verified catalog items based on customer budget, occasion, size, and styling preferences.*
> 
> *The frontend is a responsive React 18 SPA built with Vite and Tailwind CSS. The entire stack includes atomic inventory controls to prevent race conditions during checkout, multi-stage Docker containerization, a complete automated test suite with 100% pass rate, and AWS Infrastructure-as-Code using Terraform."*

---

## 2. Core Technical Questions & Model Answers

### Question 1: How does your AI agent communicate with MongoDB without hallucinating products or prices?
**Model Answer:**
> *"We enforce zero-hallucination through a tool-grounded architecture powered by Pydantic AI.
> When a customer prompts Aura (e.g. 'I need a waterproof trench coat under $150 in size L'), the LLM does not generate recommendations from its pre-trained weights. Instead, it inspects its registered tools and emits a structured tool call to `search_catalog` with the extracted parameters.
> 
> The tool executes an indexed MongoDB query on `db.products` for active, in-stock products matching those constraints. The retrieved documents are passed back to the LLM's context. The model then formats a conversational explanation, strictly copying the real product ID, title, image, and price into an `AgentStructuredResponse` schema.
> 
> If Pydantic validation fails, or if the model fabricates fields, Pydantic AI triggers a correction turn. Furthermore, our backend includes an automated deterministic fallback engine if the LLM provider experiences network or rate-limit errors."*

### Question 2: How did you unit-test the AI layer deterministically without calling a paid external API in CI/CD?
**Model Answer:**
> *"We utilized Pydantic AI's built-in `TestModel` combined with the safety guard `models.ALLOW_MODEL_REQUESTS = False`.
> In our pytest suite (`test_ai_agent.py`), we wrap agent execution inside a context manager:
> `with clothing_agent.override(model=test_model):`
> 
> `TestModel` intercepts the prompt, introspects the registered tools (`search_catalog`, `get_product_details`, `get_available_categories`), verifies that schemas match, and executes the tools using an in-memory mock database (`mongomock-motor`). This guarantees our CI/CD pipeline runs fast, offline, and deterministically with zero token costs and zero flakiness."*

### Question 3: How do you prevent inventory overselling and race conditions when multiple users checkout the last item simultaneously?
**Model Answer:**
> *"We never rely on a separate 'read-then-write' operation, which is vulnerable to race conditions (Time-of-Check to Time-of-Use, or TOCTOU).
> Instead, in `OrderService.create_order`, we execute an atomic MongoDB update query:
> `await db.products.update_one({'_id': pid, 'stock': {'$gte': qty}}, {'$inc': {'stock': -qty}})`
> 
> Because this is atomic at the document level in MongoDB, only one concurrent request will match `stock >= qty` and have `modified_count == 1`. If `modified_count == 0`, we immediately raise an HTTP 400 error indicating insufficient inventory, and cleanly roll back any items that were already reserved earlier in that checkout transaction."*

### Question 4: Why did you store snapshot objects in orders instead of foreign key references?
**Model Answer:**
> *"In e-commerce, storing dynamic references to the product catalog in historical orders is an anti-pattern. If a store administrator updates a coat's price from $189 to $240 or deletes an obsolete seasonal item, foreign key joins would dynamically alter or corrupt historical order totals and receipts.
> 
> To guarantee financial immutability, our `orders` collection embeds an `OrderItemSnapshot` capturing the exact title, purchase unit price, quantity, size, color, and image at the exact second the purchase was finalized. Catalog updates never alter historical financial records."*

### Question 5: Why choose Groq over OpenAI or Anthropic for this specific application?
**Model Answer:**
> *"In a conversational shopping experience, latency is paramount. Standard cloud GPUs typically deliver 30 to 60 tokens per second for 70B parameter models, creating an awkward 3-5 second pause before the assistant responds.
> Groq's custom Language Processing Unit (LPU) architecture achieves token generation speeds exceeding 300 tokens per second for `llama-3.3-70b-versatile`. This reduces end-to-end latency—including tool call roundtrips—to under 800 milliseconds, delivering an interactive, human-speed experience."*

### Question 6: How did you implement security and role-based access control (RBAC)?
**Model Answer:**
> *"We implemented stateless JWT authentication using `PyJWT` and password hashing with salted `bcrypt` (12 rounds).
> Sensitive administrative operations (creating/editing products, uploading images, viewing all orders, modifying order fulfillment status) are gated by FastAPI dependency injection:
> `current_admin: dict = Depends(get_current_admin)`.
> 
> The dependency extracts the Bearer JWT, validates its cryptographic signature and expiration, retrieves the user from the database, and asserts that `user['role'] == 'admin'`. Unauthorized users receive an explicit HTTP 403 Forbidden."*

### Question 7: Can you walk me through your AWS production architecture and CI/CD pipeline?
**Model Answer:**
> *"Our AWS infrastructure is provisioned through Terraform:
> 1. **Client Tier:** React SPA built with Vite, hosted on Amazon S3 and distributed globally through Amazon CloudFront CDN with Origin Access Control (OAC).
> 2. **Application Tier:** Dockerized FastAPI application running as Amazon ECS Fargate tasks behind an Application Load Balancer (ALB) across multiple availability zones.
> 3. **Data Tier:** MongoDB Atlas for transactional data and Amazon S3 for product media uploads.
> 4. **CI/CD Pipeline:** Implemented via GitHub Actions with AWS OIDC federation (no hardcoded credentials). On push to `main`, the pipeline runs formatting, executes the pytest suite, builds the Docker image, pushes it to Amazon ECR, updates the ECS Fargate service, syncs frontend assets to S3, and invalidates the CloudFront cache."*

---

## 3. Architecture Deep-Dive Checklist for System Design Interviews

Be ready to draw this diagram on a whiteboard:

```
[Browser Client: React 18 + Vite]
       |
       +---> CloudFront CDN ---> S3 (Static React Assets)
       |
       +---> Application Load Balancer (HTTPS /api/v1/*)
                   |
             [ECS Fargate Tasks: FastAPI]
                   |-- (1) Auth/RBAC (PyJWT + Bcrypt)
                   |-- (2) Catalog/Cart/Order Service
                   |-- (3) Pydantic AI Agent Engine
                             |
                             +--> Groq LPU (Llama 3.3 70B)
                             |     | (tool call)
                             +<----+
                             |
                             +--> MongoDB Atlas (Indexed Catalog)
```
