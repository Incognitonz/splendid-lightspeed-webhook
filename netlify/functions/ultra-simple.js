exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Always show popup regardless of content - just to test if popups work at all
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      actions: [
        {
          type: 'confirm',
          title: 'Ultra Simple Test',
          message: 'This popup should ALWAYS appear when going to payment',
          confirm_label: 'It works!',
          dismiss_label: 'Cancel'
        }
      ]
    })
  };
};
