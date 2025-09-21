// Add this as netlify/functions/detailed-debug.js
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
    const lineItems = data.sale?.line_items || [];
    
    // Get the full structure of the first line item
    const firstItem = lineItems[0] || {};
    const itemStructure = JSON.stringify(firstItem, null, 2);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        actions: [
          {
            type: 'confirm',
            title: 'Line Item Structure',
            message: `First line item structure:\n${itemStructure.substring(0, 300)}...`,
            confirm_label: 'OK',
            dismiss_label: 'Cancel'
          }
        ]
      })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        actions: [
          {
            type: 'confirm',
            title: 'Debug Error',
            message: `Error: ${error.message}`,
            confirm_label: 'OK',
            dismiss_label: 'Cancel'
          }
        ]
      })
    };
  }
};
