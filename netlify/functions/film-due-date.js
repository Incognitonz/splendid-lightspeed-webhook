// Complete Lab Webhook - netlify/functions/complete-lab-webhook.js
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
    
    // Lab service Product IDs organized by turnaround type
    const labServiceProductIds = {
      fast: [
        'dd8639f1-d1c5-3f25-ea83-cdf6ff08fb32', // SKU 10215 - developandscanmediumresolutionc41 - FAST
        '0d2997c4-35ef-4b24-c819-104b920d0aa7', // SKU 10214 - developandscan-socialresolutionc41 - FAST
        'bf6b2b2a-86e7-477a-b0ae-17a7fc96c11f', // SKU 13035 - disposable camera - FAST
        '1f21c3ff-f618-443c-a2af-5bc0cc26b9c9', // SKU 11994 - other film formats - FAST
        '31562d7d-0818-4c28-92a5-af769511592c', // SKU 12119 - spl400 - FAST
        '328f8d4f-8baa-4f99-af34-0df5db7f55a5', // SKU 12122 - spl400 - FAST
        'aaa21989-0f2e-446f-913a-263824dab113', // SKU 12728 - noritsu social c41 - FAST
        '1286005a-82f5-4874-8287-733089ae80ab'  // SKU 12734 - noritsu medium c41 - FAST
      ],
      '3day': [
        '2fd89437-bb52-6a6e-56e2-3aa539ac480c', // SKU 10050 - developandscanmediumresolutionc41 - 3 Day
        '8cf34c4b-cb79-6b54-2ec8-ef2196110bf1', // SKU 10213 - developandscan-socialresolutionc41 - 3 Day
        '4c2b630f-9e8b-bfc5-cc33-d236f1173b01', // SKU 10216 - developandscan-mediumresolutionbw - 3 Day
        'a5cbb028-8403-3658-dc81-dee54e2abd05', // SKU 10217 - developandscan-socialresolutionbw - 3 Day
        'da0d9b76-b144-41be-8e90-1e074e39cf4d', // SKU 11791 - other film formats - 3 Day
        '6b58abf4-e0cf-4f84-b8d9-5e9d9c3213eb', // SKU 12699 - prepaid bw - 3 Day
        'a5c982db-ef80-4b7c-8b37-8f6d208610bf', // SKU 12702 - prepaid bw - 3 Day
        'ac8cd51c-97ad-463f-b4c0-11432838a7e4', // SKU 12118 - spl400 - 3 Day
        'bc694495-6785-48da-9370-0aeb9528087b', // SKU 12121 - spl400 - 3 Day
        '2d10d9e2-079a-476f-afad-2c7d6114082a', // SKU 12738 - noritsu medium bw - 3 Day
        '4237d5a2-560f-4a3f-8bb3-5de0fd36206b', // SKU 12733 - noritsu medium c41 - 3 Day
        '40f9265a-0bed-4af9-a49a-b7d6dadf6448', // SKU 12727 - noritsu social c41 - 3 Day
        'eb7a7fbb-700d-4621-8911-1958b7b7dd72'  // SKU 12736 - noritsu social bw - 3 Day
      ],
      '1week': [
        '4e119886-956d-0315-cb21-82a02ab2135a', // SKU 10715 - developandscanmediumresolutionc41 - 1 Week
        '209a9dd6-eb1b-ddd6-39f3-07c4777108dd', // SKU 10717 - developandscan-socialresolutionc41 - 1 Week
        'eb9aa0ec-d97c-bebb-a42d-411a8d6dc42d', // SKU 10051 - developandscan-mediumresolutionbw - 1 Week
        '23d05294-3621-238f-5bad-f06b52a7aa06', // SKU 10068 - developandscan-socialresolutionbw - 1 Week
        // Ten trip tickets
        'fd2f996f-b037-e72c-56f4-703b0553ed6e', // SKU 10641 - tentripticket bw medium - 1 Week
        '5bd3ac95-b291-ed3a-1830-4ebc121ee492', // SKU 10642 - tentripticket bw medium - 1 Week
        'ef0a14db-808c-844a-6028-fb7e9422a297', // SKU 10643 - tentripticket bw social - 1 Week
        '63feb840-ba94-0d2c-5115-0f88ff5b0d3a', // SKU 10644 - tentripticket bw social - 1 Week
        'ad509f81-90a5-0c7b-6274-4bd7a9a9982c', // SKU 10645 - tentripticket c41 medium - 1 Week
        '85ebbbe0-58ea-9778-cd27-8dabe57a5755', // SKU 10646 - tentripticket c41 medium - 1 Week
        '21bf8e04-e3d0-1276-985c-b98164a252d3', // SKU 10647 - tentripticket c41 social - 1 Week
        '55e3281b-45f4-c312-3a43-0342847bf5a8', // SKU 10648 - tentripticket c41 social - 1 Week
        'c210698e-f674-44b0-a433-acd8b63acc9c', // SKU 13033 - disposable camera - 1 Week
        '55aff10a-ad14-487b-aab0-ee351504941c', // SKU 11790 - other film formats - 1 Week
        // Ten trip develop and scan
        '0cc5dfe6-ce4b-96ad-0784-b3d3b235e104', // SKU 10637 - tentripticketdevelopandscanning - 1 Week
        '0985d42b-7ba2-fd04-1ad3-cb0af075e585', // SKU 10638 - tentripticketdevelopandscanning - 1 Week
        'd12c3260-af2b-7cbe-441f-0958e29a31b7', // SKU 10639 - tentripticketdevelopandscanning - 1 Week
        'f12e5382-1899-db11-fe8a-be711e88ed7e', // SKU 10640 - tentripticketdevelopandscanning - 1 Week
        // Prepaid
        'fe073967-976f-441a-80ad-0912d8c617ff', // SKU 12698 - prepaid bw - 1 Week
        '7e6eb2ef-d1e5-473f-a704-722a4ff26083', // SKU 12701 - prepaid bw - 1 Week
        // SPL400
        'b44d4bb0-0690-4056-b850-cbe4b46820b2', // SKU 12108 - spl400 - 1 Week
        '0f029b98-342a-45b8-a582-1ad3cc517acd', // SKU 12120 - spl400 - 1 Week
        // Noritsu
        '891ba841-1a5a-4cec-a437-5497fe0e0ab7', // SKU 12737 - noritsu medium bw - 1 Week
        'f8b44fa8-edf8-4c5d-8fd7-c37c2caa5894', // SKU 12732 - noritsu medium c41 - 1 Week
        'e711af02-9873-4b4d-bcf4-46dcb8b39a7f', // SKU 12735 - noritsu social bw - 1 Week
        '93f1859d-211c-443e-bc8b-10aab623ac60'  // SKU 12726 - noritsu social c41 - 1 Week
      ]
    };

    // B&W film product IDs (for business day calculation)
    const bwFilmProductIds = [
      'fd2f996f-b037-e72c-56f4-703b0553ed6e', // tentripticket bw medium
      '5bd3ac95-b291-ed3a-1830-4ebc121ee492', // tentripticket bw medium
      'ef0a14db-808c-844a-6028-fb7e9422a297', // tentripticket bw social
      '63feb840-ba94-0d2c-5115-0f88ff5b0d3a', // tentripticket bw social
      'eb9aa0ec-d97c-bebb-a42d-411a8d6dc42d', // developandscan-mediumresolutionbw
      '4c2b630f-9e8b-bfc5-cc33-d236f1173b01', // developandscan-mediumresolutionbw
      '23d05294-3621-238f-5bad-f06b52a7aa06', // developandscan-socialresolutionbw
      'a5cbb028-8403-3658-dc81-dee54e2abd05', // developandscan-socialresolutionbw
      '6b58abf4-e0cf-4f84-b8d9-5e9d9c3213eb', // prepaid-bw-develop-and-scan
      'a5c982db-ef80-4b7c-8b37-8f6d208610bf', // prepaid-bw-develop-and-scan
      'fe073967-976f-441a-80ad-0912d8c617ff', // prepaid-bw-develop-and-scan
      '7e6eb2ef-d1e5-473f-a704-722a4ff26083', // prepaid-bw-develop-and-scan
      '891ba841-1a5a-4cec-a437-5497fe0e0ab7', // noritsu medium bw
      '2d10d9e2-079a-476f-afad-2c7d6114082a', // noritsu medium bw
      'e711af02-9873-4b4d-bcf4-46dcb8b39a7f', // noritsu social bw
      'eb7a7fbb-700d-4621-8911-1958b7b7dd72'  // noritsu social bw
    ];

    // Helper functions
    const isBusinessDay = (timestamp) => {
      const date = new Date(timestamp);
      const dayOfWeek = date.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
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
      
      return date;
    };

    const calculateDueDate = (turnaroundType, isBwFilm = false) => {
      const now = new Date();
      const currentHour = now.getHours();
      
      switch (turnaroundType) {
        case 'fast':
          if (currentHour < 14) {
            return now;
          } else {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
          }
          
        case '3day':
          if (isBwFilm) {
            return addBusinessDays(now, 3);
          } else {
            const threeDays = new Date(now);
            threeDays.setDate(threeDays.getDate() + 3);
            return threeDays;
          }
          
        case '1week':
          const oneWeek = new Date(now);
          oneWeek.setDate(oneWeek.getDate() + 7);
          return oneWeek;
          
        default:
          const defaultDate = new Date(now);
          defaultDate.setDate(defaultDate.getDate() + 1);
          return defaultDate;
      }
    };

    const formatDate = (date) => {
      return date.toLocaleDateString('en-NZ', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'Pacific/Auckland'
      });
    };

    const getTurnaroundType = (productId) => {
      if (labServiceProductIds.fast.includes(productId)) return 'fast';
      if (labServiceProductIds['3day'].includes(productId)) return '3day';
      if (labServiceProductIds['1week'].includes(productId)) return '1week';
      return null;
    };

    const isLabService = (productId) => {
      return getTurnaroundType(productId) !== null;
    };

    const isBwFilm = (productId) => {
      return bwFilmProductIds.includes(productId);
    };

    // Main logic
    if (data.event_type === 'sale.line_items.added' && data.line_items) {
      // Process each newly added line item
      for (const lineItem of data.line_items) {
        const productId = lineItem.product?.id || '';
        
        if (isLabService(productId)) {
          // Check if this item already has a due date set
          const alreadyHasDueDate = lineItem.custom_fields?.some(field => 
            field.name === 'film_due_date' && field.string_value
          );

          if (!alreadyHasDueDate) {
            const turnaroundType = getTurnaroundType(productId);
            const isBw = isBwFilm(productId);
            
            // Calculate due date
            const dueDate = calculateDueDate(turnaroundType, isBw);
            const dueDateFormatted = formatDate(dueDate);
            
            // Determine service type label
            const currentHour = new Date().getHours();
            let serviceLabel;
            if (turnaroundType === 'fast') {
              serviceLabel = currentHour < 14 ? 'FAST - Today' : 'FAST - Tomorrow';
            } else if (turnaroundType === '3day') {
              serviceLabel = isBw ? '3 Business Days' : '3 Days';
            } else {
              serviceLabel = '1 Week';
            }

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                actions: [
                  {
                    type: 'set_custom_field',
                    entity: 'line_item',
                    entity_id: lineItem.id,
                    custom_field_name: 'film_due_date',
                    custom_field_value: dueDateFormatted
                  }
                ]
              })
            };
          }
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
