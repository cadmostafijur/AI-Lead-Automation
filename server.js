const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// n8n webhook URL
// IMPORTANT: Use /webhook/ (production) NOT /webhook-test/ (test-only, requires n8n editor open)
const N8N_WEBHOOK_URL = 'https://selina-prosthionic-treasa.ngrok-free.dev/webhook/b6fd4127-2181-41e8-ba71-e0068175211b';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the project root
app.use(express.static(path.join(__dirname)));

// Helper to use native fetch (Node 18+) or fall back to node-fetch
const fetchFn = typeof fetch === 'function'
  ? fetch
  : (...args) => import('node-fetch').then(({ default: fetchImport }) => fetchImport(...args));

// POST /api/lead
app.post('/api/lead', async (req, res) => {
  try {
    const { message } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message must be a non-empty string.' });
    }

    const payload = {
      body: {
        message: message.trim(),
      },
    };

    console.log('Forwarding to n8n:', JSON.stringify(payload));

    const response = await fetchFn(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'AI-Lead-Automation-Server',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    console.log('n8n response status:', response.status);
    console.log('n8n raw response:', rawText.substring(0, 500));

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      // If the response is HTML (ngrok warning page or error), surface that clearly
      if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
        console.error('Received HTML instead of JSON - likely an ngrok interstitial page.');
        return res.status(502).json({
          error: 'Received HTML from upstream instead of JSON. Check that ngrok and n8n are running.',
        });
      }
      data = { raw: rawText };
    }

    if (!response.ok) {
      return res.status(502).json({
        error: 'Upstream n8n webhook returned an error.',
        status: response.status,
        details: data,
      });
    }

    // Try to surface a useful AI reply if present
    const aiReply = data.reply || data.text || data.message || data.raw || data;

    const clientResponse = {
      success: true,
      reply: aiReply,
      raw: data,
    };

    console.log('Sending back to frontend:', JSON.stringify(clientResponse).substring(0, 300));
    return res.status(200).json(clientResponse);
  } catch (err) {
    console.error('Error in /api/lead:', err);
    return res.status(500).json({
      error: 'Internal server error while processing lead.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

