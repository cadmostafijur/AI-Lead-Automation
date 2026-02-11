# AI Lead Automation

This project implements an AI-driven lead handling automation using n8n and a Large Language Model (LLM). The system accepts incoming lead messages via a webhook, classifies intent, extracts structured data, stores it in a datastore, and sends an AI-generated automated response.

## Workflow Overview

The automation runs as an n8n workflow with the following steps:

1. **Webhook** – Receives POST requests containing a lead message (e.g. `body.message`).
2. **Basic LLM Chain** – Uses Google Gemini to classify intent (Sales, Support, or Spam) and extract structured fields: name, company, requirement. Output is strict JSON only.
3. **Code (JavaScript)** – Parses the LLM JSON output, strips markdown fences, and normalizes the data with a `receivedAt` timestamp.
4. **If** – Branches on intent: if the intent is "Spam", the flow goes to "Edit Fields" and then responds with a generic message; otherwise it continues to store and reply.
5. **Insert row** – Writes the extracted lead (name, company, requirement, intent, receivedAt) into an n8n Data Table (e.g. "leads").
6. **Basic LLM Chain (reply)** – Generates a short, professional reply: thanks and confirms receipt when all fields are present, or politely asks only for missing information.
7. **Respond to Webhook** – Returns a JSON response with `status: "received"` and the generated `reply` text.

Spam leads do not get stored; they receive a simple "Thanks for your message" and the workflow ends.

## Workflow Diagram

![AI Lead Automation workflow](SS/Screenshot%202026-02-11%20122143.png)

## Prerequisites

- **n8n** – Self-hosted or n8n Cloud instance.
- **Google Gemini (PaLM) API** – API key configured in n8n credentials (e.g. "Google Gemini(PaLM) Api account").
- **n8n Data Table** – A table named "leads" with columns: `name`, `company`, `requirement`, `intent`, `receivedAt` (or equivalent). The workflow JSON references a table ID; you may need to create or link your own table in your n8n project.

## Installation

1. Import the workflow in n8n:
   - In n8n, go to Workflows and use **Import from File** (or paste).
   - Select or paste the contents of `AI Lead Automation.json`.

2. Configure credentials:
   - Open the **Google Gemini Chat Model** node and attach your Google Gemini (PaLM) API credentials.

3. Adjust the Data Table (optional):
   - Open the **Insert row** node and either select your existing "leads" Data Table or create one in your n8n project and map the columns to match the workflow output.

4. Activate the workflow so the webhook is live.

## Webhook Usage

**Endpoint:** `POST /webhook/<your-webhook-path>`  
(The exact path is defined in the Webhook node; in the exported JSON it uses a UUID path.)

**Request body (example):**

```json
{
  "body": {
    "message": "Hi, I'm John from Acme Corp. We need help with enterprise integration."
  }
}
```

**Response (non-Spam, success):**

```json
{
  "status": "received",
  "reply": "Thank you for reaching out, John. We have received your request regarding enterprise integration from Acme Corp and will get back to you shortly."
}
```

For Spam intent, the reply is a generic acknowledgment. Stored leads appear in the configured Data Table with intent, name, company, requirement, and receivedAt.

## Project Structure

```
AI-Lead-Automation/
  README.md                 - This file
  AI Lead Automation.json   - n8n workflow export
  SS/                       - Screenshots
    Screenshot 2026-02-11 122143.png  - Workflow diagram
```

## License

Use and modify as needed for your environment. Ensure API keys and credentials are kept secure and not committed to version control.
