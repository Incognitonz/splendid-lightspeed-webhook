// Netlify Function for Lightspeed Film Lab Due Date Popup
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
    
    // Validate the request
    if (!data || !data.event_type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request' })
      };
    }

    // Lab service SKUs organized by turnaround type
    const labServiceSkus = {
      fast: [
        '10215', '10214', '13035', '11994', '12119', '12122', '12728', '12734'
      ],
      '3day': [
        '10050', '10213', '10216', '10217', '11791', '12699', '12702', 
        '12118', '12121', '12738', '12733', '12727', '12736'
      ],
      '1week': [
        '10715', '10717', '10051', '10068', '10641', '10642', '10643', '10644',
        '10645', '10646', '10647', '10648', '13033', '11790', '10637', '10638',
        '10639', '10640', '12698', '12701', '12108', '12120', '12737', '12732',
        '12735', '12726'
      ]
    };

    // B&W film SKUs
    const bwFilmSkus = [
      '10641', '10642', '10643', '10644', '10051', '10216', '10068', '10217',
      '10048', '10218', '10219', '10718', '11053', '11054', '12699', '12702',
      '12698', '12701', '12737', '12738', '12735', '12736', '11058', '11059'
    ];

    // All lab service SKUs
    const allLabServiceSkus = [...labServiceSkus.fast, ...labServiceSkus['3day'], ...labServiceSkus['1week']];

    // Helper functions
    const isBusinessDay = (timestamp) => {
      const date = new Date(timestamp);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    };

    const addBusinessDays = (startDate, days) => {
      let date = new Date(startDate);
      let addedDays = 0;
      
      while (addedDays < days) {
        date.setDate(date.getDate() + 1);
        if (isBusinessDay(date.getTime())) {
          addedDays++;
        }
      }
      
      return date.getTime();
    };

    const calculateDueDate = (turnaroundType, isBwFilm = false) => {
      const now = new Date();
      const currentHour = now.getHours();
      
      switch (turnaroundType) {
        case 'fast':
          // Same day if before 2pm, otherwise next day
          if (currentHour < 14) {
            return now.getTime();
          } else {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.getTime();
          }
          
        case '3day':
          if (isBwFilm) {
            // B&W: 3 business days
            return addBusinessDays(now.getTime(), 3);
          } else {
            // C41: 3 calendar days
            const threeDays = new Date(now);
            threeDays.setDate(threeDays.getDate() + 3);
            return threeDays.getTime();
          }
          
        case '1week':
          // 7 calendar days
          const oneWeek = new Date(now);
          oneWeek.setDate(oneWeek.getDate() + 7);
          return oneWeek.getTime();
          
        default:
          const defaultDate = new Date(now);
          defaultDate.setDate(defaultDate.getDate() + 1);
          return defaultDate.getTime();
      }
    };

    const hasLabServices = (lineItems) => {
      return lineItems.some(item => {
        const productSku = item.product?.sku || '';
        const itemSku = item.sku || '';
        return allLabServiceSkus.includes(productSku) || allLabServiceSkus.includes(itemSku);
      });
    };

    const detectBwFilm = (lineItems) => {
      return lineItems.some(item => {
        const productSku = item.product?.sku || '';
        const itemSku = item.sku || '';
        return bwFilmSkus.includes(productSku) || bwFilmSkus.includes(itemSku);
      });
    };

    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    // Main logic
    let actions = [];

    if (data.event_type === 'sale.ready_for_payment') {
      const lineItems = data.sale?.line_items || [];
      
      if (hasLabServices(lineItems)) {
        // Check if due date already exists
        const customFields = data.sale?.custom_fields || [];
        const existingDueDate = customFields.find(field => field.name === 'lab_due_date');
        
        if (!existingDueDate) {
          const isBwFilm = detectBwFilm(lineItems);
          
          // Calculate due dates for each option
          const fastDate = formatDate(calculateDueDate('fast', isBwFilm));
          const threeDayDate = formatDate(calculateDueDate('3day', isBwFilm));
          const weekDate = formatDate(calculateDueDate('1week', isBwFilm));
          
          const currentHour = new Date().getHours();
          const fastLabel = currentHour < 14 ? `FAST - Today (${fastDate})` : `FAST - Tomorrow (${fastDate})`;
          const threeDayLabel = isBwFilm ? `3 Business Days - Due: ${threeDayDate}` : `3 Days - Due: ${threeDayDate}`;
          
          actions.push({
            type: 'require_custom_fields',
            title: '📸 Splendid Film Lab - Set Due Date',
            message: 'Please select the turnaround time for this lab order:',
            entity: 'sale',
            required_custom_fields: [{
              name: 'lab_turnaround_selection',
              values: [
                { value: 'fast', title: fastLabel },
                { value: '3day', title: threeDayLabel },
                { value: '1week', title: `1 Week - Due: ${weekDate}` }
              ]
            }]
          });
        }
      }
    }

    // Handle turnaround selection
    if (data.sale?.custom_fields) {
      const customFields = data.sale.custom_fields;
      const turnaroundField = customFields.find(field => field.name === 'lab_turnaround_selection');
      
      if (turnaroundField && data.event_type === 'sale.ready_for_payment') {
        const lineItems = data.sale.line_items || [];
        const isBwFilm = detectBwFilm(lineItems);
        const turnaround = turnaroundField.string_value || turnaroundField.value;
        
        // Calculate due date
        const dueDate = calculateDueDate(turnaround, isBwFilm);
        const dueDateFormatted = formatDate(dueDate);
        
        // Set due date in custom field
        actions.push({
          type: 'set_custom_field',
          entity: 'sale',
          custom_field_name: 'lab_due_date',
          custom_field_value: `Due: ${dueDateFormatted}`
        });
        
        // Add to sale note
        const currentNote = data.sale.note || '';
        const newNote = currentNote ? `${currentNote}\nDue: ${dueDateFormatted}` : `Due: ${dueDateFormatted}`;
        
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
      body: JSON.stringify({ actions })
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
