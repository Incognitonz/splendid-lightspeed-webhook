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
    
    const targetProductId = '2fd89437-bb52-6a6e-56e2-3aa539ac480c';
    
    if (data.event_type === 'sale.line_items.added' && data.line_items) {
      const labServiceItem = data.line_items.find(item => {
        const productId = item.product?.id || '';
        return productId === targetProductId;
      });

      if (labServiceItem) {
        // Check if this item already has a due date set
        const alreadyHasDueDate = labServiceItem.custom_fields?.some(field => 
          field.name === 'film_due_date' && field.string_value
        );

        console.log('Lab service found. Already has due date:', alreadyHasDueDate);

        // Only show popup if due date is not already set
        if (!alreadyHasDueDate) {
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
