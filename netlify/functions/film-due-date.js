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
    
    // Log the incoming request
    console.log('=== FILM DUE DATE WEBHOOK ===');
    console.log('Event type:', data.event_type);
    console.log('Retailer:', data.retailer?.domain_prefix);
    console.log('User:', data.user?.username);
    console.log('Line items added:', data.line_items?.length || 0);
    
    // Check for your specific product ID in the newly added line items
    const targetProductId = '2fd89437-bb52-6a6e-56e2-3aa539ac480c'; // SKU 10050
    
    if (data.event_type === 'sale.line_items.added' && data.line_items) {
      const labServiceItem = data.line_items.find(item => {
        const productId = item.product?.id || '';
        console.log('Checking item product ID:', productId);
        return productId === targetProductId;
      });

      if (labServiceItem) {
        console.log('Lab service found! Item ID:', labServiceItem.id);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            actions: [
              {
                type: 'require_custom_fields',
                title: 'Film Lab Due Date',
                message: 'Enter turnaround time for this film:',
                entity: 'line_item',
                entity_id: labServiceItem.id,
                required_custom_fields: [
                  {
                    name: 'film_due_date'
                  }
                ]
              }
            ]
          })
        };
      }
    }

    console.log('No lab service detected or wrong event type');
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
