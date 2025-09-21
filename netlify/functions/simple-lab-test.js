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
    
    // Log what Lightspeed actually sends
    console.log('=== LIGHTSPEED POS REQUEST ===');
    console.log('Full request body:', JSON.stringify(data, null, 2));
    console.log('==============================');
    
    // Simple check for your specific product ID
    const targetProductId = '2fd89437-bb52-6a6e-56e2-3aa539ac480c';
    const lineItems = data.sale?.line_items || [];
    
    console.log('Checking for product ID:', targetProductId);
    console.log('Line items found:', lineItems.length);
    
    const hasLabService = lineItems.some(item => {
      const productId = item.product_id || item.product?.id || '';
      console.log('Item product_id:', productId);
      return productId === targetProductId;
    });

    console.log('Has lab service:', hasLabService);
    console.log('Event type:', data.event_type);

    if (hasLabService && data.event_type === 'sale.ready_for_payment') {
      console.log('✅ SHOULD SHOW POPUP');
      // Calculate simple due date (3 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      const dueDateStr = dueDate.toLocaleDateString('en-AU');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          actions: [
            {
              type: 'require_custom_fields',
              title: '📸 Splendid Film Lab - Set Due Date',
              message: 'Please select the turnaround time:',
              entity: 'sale',
              required_custom_fields: [
                {
                  name: 'lab_turnaround_selection',
                  values: [
                    { value: '3day', title: `3 Days - Due: ${dueDateStr}` }
                  ]
                }
              ]
            }
          ]
        })
      };
    } else {
      console.log('❌ CONDITIONS NOT MET - no popup');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ actions: [] })
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
