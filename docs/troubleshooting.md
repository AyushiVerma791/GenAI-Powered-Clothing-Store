# Troubleshooting & Common Issues Guide

This guide covers common issues encountered during local development, test execution, and deployment, along with verified resolutions.

---

## 1. MongoDB Connection Issues

### Symptom: `ServerSelectionTimeoutError` or `MongoDB ping failed on startup`
- **Cause:** MongoDB service is not running locally on port 27017, or MongoDB Atlas IP access list does not allow your current IP address.
- **Resolution:**
  1. For local Docker MongoDB:
     ```bash
     docker compose up -d mongo
     ```
  2. For MongoDB Atlas:
     - Navigate to **Network Access** in the MongoDB Atlas console.
     - Add your current IP or allow `0.0.0.0/0` (for testing environments).
     - Verify connection string in `.env`: `MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/clothing_store_db?retryWrites=true&w=majority`

---

## 2. Groq AI & Pydantic AI Errors

### Symptom: `UserError: Set the GROQ_API_KEY environment variable`
- **Cause:** Neither `GROQ_API_KEY` was found in `.env` nor in shell environment variables.
- **Resolution:**
  - Obtain a free key from [console.groq.com](https://console.groq.com/keys).
  - Add it to `.env`: `GROQ_API_KEY=gsk_your_actual_key`.
  - Alternatively, enable development mock mode: `AI_MOCK_MODE=True`. When mock mode is enabled, the backend performs deterministic keyword & catalog retrieval from MongoDB without requiring any external LLM calls.

### Symptom: Groq API Rate Limit (HTTP 429)
- **Cause:** Rate limits exceeded on free tier.
- **Resolution:**
  - Our agent implementation includes an automatic `try/except` fallback in `app/ai/agent.py`:
  - When Groq rate limits or network issues occur, the system automatically falls back to `run_deterministic_assistant`, returning genuine products from MongoDB without crashing or displaying raw errors to the user.

---

## 3. CORS & Network Issues in React

### Symptom: `Access to fetch at ... has been blocked by CORS policy`
- **Cause:** The origin of the frontend (`http://localhost:5173` or `http://localhost:3000`) is missing from `ALLOWED_ORIGINS` in `.env`.
- **Resolution:**
  - Ensure `.env` includes:
    ```ini
    ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
    ```
  - Also ensure Vite's proxy in `vite.config.js` is active so relative `/api` paths proxy directly to port 8000.

---

## 4. Docker Desktop Port Conflicts

### Symptom: `bind: address already in use` for port 80, 8000, or 27017
- **Resolution:**
  - Check which process is occupying the port (Windows PowerShell):
    ```powershell
    Get-NetTCPConnection -LocalPort 8000
    ```
  - In `docker-compose.yml`, change the host port mapping (e.g. `"8080:8000"` for backend or `"3000:80"` for frontend).

---

## 5. Token & Authentication Issues

### Symptom: `401 Unauthorized: Malformed token credentials` or `Invalid or expired access token`
- **Cause:** The JWT expired (default lifetime is 24 hours), or `JWT_SECRET_KEY` was changed in `.env` after token creation.
- **Resolution:**
  - Sign out and sign back in to issue a fresh JWT signed with the current `JWT_SECRET_KEY`.
  - In browser devtools, clear `localStorage.removeItem('token')`.
