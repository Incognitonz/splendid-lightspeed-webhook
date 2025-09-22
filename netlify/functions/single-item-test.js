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
    
    // Only look for one specific product ID
    const targetProductId = '2fd89437-bb52-6a6e-56e2-3aa539ac480c'; // SKU 10050
    const lineItems = data.sale?.line_items || [];
    
    // Find the specific lab service line item
    const labServiceItem = lineItems.find(item => {
      const productId = item.product_id || item.product?.id || '';
      return productId === targetProductId;
    });

    if (labServiceItem && data.event_type === 'sale.line_items.added') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          actions: [
            {
              type: 'confirm',
              title: 'Lab Service Added',
              message: `Lab service detected! Product ID: ${labServiceItem.product_id}`,
              confirm_label: 'OK',
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
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
