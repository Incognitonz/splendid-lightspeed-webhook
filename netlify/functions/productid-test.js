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
    
    // Look specifically for your SKU 10050 product ID
    const targetProductId = '2fd89437-bb52-6a6e-56e2-3aa539ac480c';
    const hasTargetProduct = lineItems.some(item => {
      const productId = item.product_id || item.product?.id || '';
      return productId === targetProductId;
    });

    if (hasTargetProduct) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          actions: [
            {
              type: 'confirm',
              title: '🎉 Found SKU 10050!',
              message: 'Product ID 2fd89437-bb52-6a6e-56e2-3aa539ac480c detected successfully!',
              confirm_label: 'Awesome!',
              dismiss_label: 'Cancel'
            }
          ]
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ actions: [] })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        actions: [
          {
            type: 'confirm',
            title: 'Error',
            message: `Error: ${error.message}`,
            confirm_label: 'OK',
            dismiss_label: 'Cancel'
          }
        ]
      })
    };
  }
};
