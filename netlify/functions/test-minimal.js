exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Always return a simple popup regardless of content
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      actions: [
        {
          type: 'confirm',
          title: 'Test Popup',
          message: 'If you see this, workflows are working!',
          confirm_label: 'Great!',
          dismiss_label: 'Cancel'
        }
      ]
    })
  };
};
