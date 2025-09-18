// Simple Test Function for Lightspeed Integration
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body || '{}');
    
    // Simple validation
    if (!data || !data.event_type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request' })
      };
    }

    let actions = [];

    // Only trigger on sale.ready_for_payment
    if (data.event_type === 'sale.ready_for_payment') {
      const lineItems = data.sale?.line_items || [];
      
      // Check if SKU 10500 is in the cart
      const hasSku10500 = lineItems.some(item => {
        const productSku = item.product?.sku || '';
        const itemSku = item.sku || '';
        return productSku === '10500' || itemSku === '10500';
      });

      if (hasSku10500) {
        // Show popup and add note
        actions.push({
          type: 'confirm',
          title: 'Test Success!',
          message: 'Yay! It worked! SKU 10500 detected.',
          confirm_label: 'Continue',
          dismiss_label: 'Cancel'
        });

        // Add note to sale
        const currentNote = data.sale?.note || '';
        const newNote = currentNote 
          ? currentNote + '\n🎉 Test worked! SKU 10500 detected at ' + new Date().toLocaleString()
          : '🎉 Test worked! SKU 10500 detected at ' + new Date().toLocaleString();

        actions.push({
          type: 'set_custom_field',
          entity: 'sale',
          custom_field_name: 'note',
          custom_field_value: newNote
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        actions,
        debug: {
          event_type: data.event_type,
          line_items_count: data.sale?.line_items?.length || 0,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
