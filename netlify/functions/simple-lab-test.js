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
    
    // Check for your specific product ID
    const targetProductId = '2fd89437-bb52-6a6e-56e2-3aa539ac480c';
    const lineItems = data.sale?.line_items || [];
    
    const hasLabService = lineItems.some(item => {
      const productId = item.product_id || item.product?.id || '';
      return productId === targetProductId;
    });

    if (hasLabService && data.event_type === 'sale.ready_for_payment') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          actions: [
            {
              type: 'require_custom_fields',
              title: 'Film Lab Due Date',
              message: 'Enter due date for this lab order:',
              entity: 'sale',
              required_custom_fields: [
                {
                  name: 'lab_due_date'
                }
              ]
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
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
