const form = document.getElementById('lead-form');
const messageInput = document.getElementById('message');
const statusEl = document.getElementById('status');
const submitButton = document.getElementById('submit-button');
const responseCard = document.getElementById('response-card');
const responseText = document.getElementById('response-text');

// Check if the page is opened directly from the file system
if (window.location.protocol === 'file:') {
  document.addEventListener('DOMContentLoaded', () => {
    setStatus(
      'ERROR: Open this page via http://localhost:3000 instead of opening the HTML file directly.',
      'error'
    );
    submitButton.disabled = true;
  });
}

function setStatus(text, type) {
  statusEl.textContent = text || '';
  statusEl.classList.remove('status--loading', 'status--error', 'status--success');
  if (type) {
    statusEl.classList.add('status--' + type);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const message = messageInput.value.trim();

  if (!message) {
    setStatus('Please enter a message before submitting.', 'error');
    return;
  }

  setStatus('Processing... AI is analyzing your message (this may take 10-20 seconds)', 'loading');
  submitButton.disabled = true;
  submitButton.textContent = 'Processing...';
  responseCard.hidden = true;
  responseText.textContent = '';

  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    let payload;
    try {
      payload = await res.json();
    } catch (parseErr) {
      console.error('Failed to parse server response as JSON:', parseErr);
      setStatus('Server returned an invalid response. Check the backend terminal for details.', 'error');
      return;
    }

    console.log('Server response:', res.status, payload);

    if (!res.ok || payload.error) {
      const errorMessage =
        payload.error ||
        'Something went wrong while submitting your message. Please try again.';
      setStatus(errorMessage, 'error');
      return;
    }

    const reply = typeof payload.reply === 'string'
      ? payload.reply
      : JSON.stringify(payload.reply, null, 2);

    responseText.textContent = reply || 'No response content received.';
    responseCard.hidden = false;
    setStatus('Response received successfully.', 'success');
  } catch (err) {
    console.error('Client fetch error:', err);
    if (window.location.protocol === 'file:') {
      setStatus('You must open this page via http://localhost:3000, not as a local file.', 'error');
    } else {
      setStatus('Network error. Make sure the server is running (node server.js).', 'error');
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
}

form.addEventListener('submit', handleSubmit);

