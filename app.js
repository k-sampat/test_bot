// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post("/webhook", async (req, res) => {
  const body = req.body;

  // WhatsApp requires a response of 200 fast
  res.sendStatus(200);

  try {
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

    if (!messages) return;

    const message = messages[0];
    const from = message.from; // user phone number
    const text = message.text?.body;

    // Forward to n8n
    await fetch("https://ksampat.app.n8n.cloud/webhook/incoming-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        text,
        raw: body
      })
    });
  } catch (err) {
    console.error("Error forwarding to n8n:", err);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
