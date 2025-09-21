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
    
    // Extract line items info
    const lineItems = data.sale?.line_items || [];
    const skus = lineItems.map(item => item.product?.sku || item.sku || 'NO_SKU');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        actions: [
          {
            type: 'confirm',
            title: 'Debug Info',
            message: `Event: ${data.event_type}\nLine Items: ${lineItems.length}\nSKUs: ${skus.join(', ')}\nLooking for: 10050`,
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
