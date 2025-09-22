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
    
    // Lab service product IDs
    const labServiceProductIds = [
      '2fd89437-bb52-6a6e-56e2-3aa539ac480c', // SKU 10050 - 3 Day
      'dd8639f1-d1c5-3f25-ea83-cdf6ff08fb32'  // SKU 10215 - FAST
    ];
    
    const lineItems = data.sale?.line_items || [];
    
    // Find all lab service line items that don't already have due dates
    const labServiceItems = lineItems.filter(item => {
      const productId = item.product_id || item.product?.id || '';
      const isLabService = labServiceProductIds.includes(productId);
      const alreadyHasDueDate = item.custom_fields?.some(field => field.name === 'lab_due_date');
      return isLabService && !alreadyHasDueDate;
    });

    // Process one lab service item at a time
    if (labServiceItems.length > 0 && data.event_type === 'sale.line_items.added') {
      const firstLabItem = labServiceItems[0];
      
      // Determine turnaround type based on product ID
      let turnaroundType;
      if (firstLabItem.product_id === 'dd8639f1-d1c5-3f25-ea83-cdf6ff08fb32') {
        turnaroundType = 'FAST';
      } else if (firstLabItem.product_id === '2fd89437-bb52-6a6e-56e2-3aa539ac480c') {
        turnaroundType = '3 Day';
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          actions: [
            {
              type: 'require_custom_fields',
              title: `Film Lab Due Date - ${turnaroundType}`,
              message: `Enter due date for this ${turnaroundType} lab service:`,
              entity: 'line_item',
              entity_id: firstLabItem.id,
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
