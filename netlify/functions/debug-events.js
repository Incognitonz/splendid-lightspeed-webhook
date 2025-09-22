exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    
    console.log('=== WEBHOOK CALLED ===');
    console.log('Event type:', data.event_type);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Line items count:', data.sale?.line_items?.length || 0);
    console.log('=====================');
    
    // Always return a popup so we know the webhook was called
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        actions: [
          {
            type: 'confirm',
            title: 'Webhook Called!',
            message: `Event: ${data.event_type} at ${new Date().toLocaleTimeString()}`,
            confirm_label: 'OK',
            dismiss_label: 'Cancel'
          }
        ]
      })
    };

  } catch (error) {
    console.log('ERROR:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
