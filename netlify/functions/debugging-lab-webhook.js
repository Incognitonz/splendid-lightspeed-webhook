// Debug Lab Webhook - netlify/functions/complete-lab-webhook.js
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
    
    const labServiceProductIds = {
      fast: [
        'dd8639f1-d1c5-3f25-ea83-cdf6ff08fb32',
        '0d2997c4-35ef-4b24-c819-104b920d0aa7',
        'bf6b2b2a-86e7-477a-b0ae-17a7fc96c11f',
        '1f21c3ff-f618-443c-a2af-5bc0cc26b9c9',
        '31562d7d-0818-4c28-92a5-af769511592c',
        '328f8d4f-8baa-4f99-af34-0df5db7f55a5',
        'aaa21989-0f2e-446f-913a-263824dab113',
        '1286005a-82f5-4874-8287-733089ae80ab'
      ],
      '3day': [
        '2fd89437-bb52-6a6e-56e2-3aa539ac480c',
        '8cf34c4b-cb79-6b54-2ec8-ef2196110bf1',
        '4c2b630f-9e8b-bfc5-cc33-d236f1173b01',
        'a5cbb028-8403-3658-dc81-dee54e2abd05',
        'da0d9b76-b144-41be-8e90-1e074e39cf4d',
        '6b58abf4-e0cf-4f84-b8d9-5e9d9c3213eb',
        'a5c982db-ef80-4b7c-8b37-8f6d208610bf',
        'ac8cd51c-97ad-463f-b4c0-11432838a7e4',
        'bc694495-6785-48da-9370-0aeb9528087b',
        '2d10d9e2-079a-476f-afad-2c7d6114082a',
        '4237d5a2-560f-4a3f-8bb3-5de0fd36206b',
        '40f9265a-0bed-4af9-a49a-b7d6dadf6448',
        'eb7a7fbb-700d-4621-8911-1958b7b7dd72'
      ],
      '1week': [
        '4e119886-956d-0315-cb21-82a02ab2135a',
        '209a9dd6-eb1b-ddd6-39f3-07c4777108dd',
        'eb9aa0ec-d97c-bebb-a42d-411a8d6dc42d',
        '23d05294-3621-238f-5bad-f06b52a7aa06',
        'c210698e-f674-44b0-a433-acd8b63acc9c',
        '55aff10a-ad14-487b-aab0-ee351504941c',
        'fd2f996f-b037-e72c-56f4-703b0553ed6e',
        '5bd3ac95-b291-ed3a-1830-4ebc121ee492',
        'ef0a14db-808c-844a-6028-fb7e9422a297',
        '63feb840-ba94-0d2c-5115-0f88ff5b0d3a',
        'ad509f81-90a5-0c7b-6274-4bd7a9a9982c',
        '85ebbbe0-58ea-9778-cd27-8dabe57a5755',
        '21bf8e04-e3d0-1276-985c-b98164a252d3',
        '55e3281b-45f4-c312-3a43-0342847bf5a8',
        'fe073967-976f-441a-80ad-0912d8c617ff',
        '7e6eb2ef-d1e5-473f-a704-722a4ff26083',
        'b44d4bb0-0690-4056-b850-cbe4b46820b2',
        '0f029b98-342a-45b8-a582-1ad3cc517acd',
        '891ba841-1a5a-4cec-a437-5497fe0e0ab7',
        'f8b44fa8-edf8-4c5d-8fd7-c37c2caa5894',
        'e711af02-9873-4b4d-bcf4-46dcb8b39a7f',
        '93f1859d-211c-443e-bc8b-10aab623ac60'
      ]
    };
    
    const bwFilmProductIds = [
      'fd2f996f-b037-e72c-56f4-703b0553ed6e',
      '5bd3ac95-b291-ed3a-1830-4ebc121ee492',
      'ef0a14db-808c-844a-6028-fb7e9422a297',
      '63feb840-ba94-0d2c-5115-0f88ff5b0d3a',
      'eb9aa0ec-d97c-bebb-a42d-411a8d6dc42d',
      '4c2b630f-9e8b-bfc5-cc33-d236f1173b01',
      '23d05294-3621-238f-5bad-f06b52a7aa06',
      'a5cbb028-8403-3658-dc81-dee54e2abd05',
      '6b58abf4-e0cf-4f84-b8d9-5e9d9c3213eb',
      'a5c982db-ef80-4b7c-8b37-8f6d208610bf',
      'fe073967-976f-441a-80ad-0912d8c617ff',
      '7e6eb2ef-d1e5-473f-a704-722a4ff26083',
      '891ba841-1a5a-4cec-a437-5497fe0e0ab7',
      '2d10d9e2-079a-476f-afad-2c7d6114082a',
      'e711af02-9873-4b4d-bcf4-46dcb8b39a7f',
      'eb7a7fbb-700d-4621-8911-1958b7b7dd72'
    ];

    const HOLIDAYS_API_KEY = 'b122addcbe0a49fb9755318d5edc5c62';
    const HOLIDAYS_API_URL = 'https://api.public-holidays.nz/v1';

    let publicHolidaysCache = null;
    let cacheYear = null;
    let debugLog = [];
    let holidayEncountered = null; // Track if a holiday caused a delay

    const addDebug = (message) => {
      const timestamp = new Date().toISOString();
      debugLog.push(`[${timestamp}] ${message}`);
      console.log(`[${timestamp}] ${message}`);
    };

    const fetchPublicHolidays = async (year) => {
      try {
        if (publicHolidaysCache && cacheYear === year) {
          addDebug(`Using cached holidays for ${year}`);
          return publicHolidaysCache;
        }

        const url = `${HOLIDAYS_API_URL}/year?apikey=${HOLIDAYS_API_KEY}&year=${year}`;
        addDebug(`Fetching holidays from: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          addDebug(`API returned status ${response.status}`);
          return [];
        }

        const holidays = await response.json();
        
        // Debug: Log raw API response structure
        addDebug(`Raw API response type: ${typeof holidays}`);
        addDebug(`Raw API response: ${JSON.stringify(holidays).substring(0, 500)}`);
        
        let holidayArray = holidays;
        // Check if response is wrapped in an object
        if (holidays.holidays) {
          holidayArray = holidays.holidays;
          addDebug(`Unwrapped from .holidays property`);
        }
        
        addDebug(`API returned ${holidayArray.length} holidays for ${year}`);
        
        // Debug: Log all holidays and convert date format
        holidayArray.forEach((holiday, index) => {
          addDebug(`Holiday ${index}: ${JSON.stringify(holiday).substring(0, 200)}`);
          if (holiday.ActualDate && holiday.HolidayName) {
            const [day, month, yr] = holiday.ActualDate.split('/');
            const isoDate = `${yr}-${month}-${day}`;
            addDebug(`  - ${isoDate}: ${holiday.HolidayName}`);
          } else {
            addDebug(`  Missing fields. Got: ${Object.keys(holiday).join(', ')}`);
          }
        });
        
        publicHolidaysCache = holidayArray;
        cacheYear = year;
        return holidayArray;


      } catch (error) {
        addDebug(`Error fetching holidays: ${error.message}`);
        return [];
      }
    };

    const isPublicHoliday = async (date) => {
      const year = date.getFullYear();
      const holidays = await fetchPublicHolidays(year);
      
      const dateString = date.toISOString().split('T')[0];
      addDebug(`Checking if ${dateString} (${date.toDateString()}) is a holiday`);
      
      const isHoliday = holidays.some(holiday => {
        const [day, month, yr] = holiday.ActualDate.split('/');
        const holidayIsoDate = `${yr}-${month}-${day}`;
        const match = holidayIsoDate === dateString;
        if (match) {
          addDebug(`  ✓ MATCH FOUND: ${holiday.HolidayName}`);
          holidayEncountered = holiday.HolidayName; // Store the holiday name
        }
        return match;
      });
      
      if (!isHoliday) {
        addDebug(`  ✗ Not a holiday`);
      }
      
      return isHoliday;
    };

    const isBusinessDay = async (timestamp) => {
      const date = new Date(timestamp);
      const dayOfWeek = date.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        addDebug(`  ${date.toDateString()} is a ${dayNames[dayOfWeek]} (weekend)`);
        return false;
      }
      
      const isHoliday = await isPublicHoliday(date);
      return !isHoliday;
    };

    const isOperatingDay = async (timestamp) => {
      const date = new Date(timestamp);
      const isHoliday = await isPublicHoliday(date);
      return !isHoliday;
    };

    const addBusinessDays = async (startDate, days) => {
      let date = new Date(startDate);
      let addedDays = 0;
      
      addDebug(`Adding ${days} business days from ${date.toDateString()}`);
      
      while (addedDays < days) {
        date.setDate(date.getDate() + 1);
        const isBusiness = await isBusinessDay(date.getTime());
        if (isBusiness) {
          addedDays++;
          addDebug(`  + Business day ${addedDays}: ${date.toDateString()}`);
        }
      }
      
      addDebug(`Final date after adding ${days} business days: ${date.toDateString()}`);
      return date;
    };

    const moveToNextOperatingDay = async (date) => {
      let adjustedDate = new Date(date);
      addDebug(`Moving ${adjustedDate.toDateString()} to next operating day (excluding holidays only)`);
      
      let iterations = 0;
      while (!(await isOperatingDay(adjustedDate.getTime()))) {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        iterations++;
        if (iterations > 100) {
          addDebug(`Safety break: too many iterations`);
          break;
        }
      }
      
      addDebug(`  → Final operating day: ${adjustedDate.toDateString()}`);
      return adjustedDate;
    };

    const moveToNextBusinessDay = async (date) => {
      let adjustedDate = new Date(date);
      addDebug(`Moving ${adjustedDate.toDateString()} to next business day (excluding weekends & holidays)`);
      
      let iterations = 0;
      while (!(await isBusinessDay(adjustedDate.getTime()))) {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        iterations++;
        if (iterations > 100) {
          addDebug(`Safety break: too many iterations`);
          break;
        }
      }
      
      addDebug(`  → Final business day: ${adjustedDate.toDateString()}`);
      return adjustedDate;
    };

    const calculateDueDate = async (turnaroundType, isBwFilm = false) => {
      const now = new Date();
      const nzTime = new Date(now.toLocaleString("en-US", {timeZone: "Pacific/Auckland"}));
      const currentHour = nzTime.getHours();
      const currentDay = nzTime.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      addDebug(`\n=== DUE DATE CALCULATION ===`);
      addDebug(`Current NZ time: ${nzTime.toString()}`);
      addDebug(`Current day: ${dayNames[currentDay]} (${nzTime.toDateString()})`);
      addDebug(`Current hour: ${currentHour}`);
      addDebug(`Turnaround type: ${turnaroundType}`);
      addDebug(`Film type: ${isBwFilm ? 'B&W' : 'C41'}`);
      
      let dueDate;
      
      switch (turnaroundType) {
        case 'fast':
          const isWeekend = currentDay === 0 || currentDay === 6;
          const cutoffHour = isWeekend ? 13 : 14;
          
          addDebug(`FAST service - cutoff: ${cutoffHour}:00 (${isWeekend ? 'weekend' : 'weekday'})`);
          addDebug(`Current hour (${currentHour}) < cutoff (${cutoffHour})? ${currentHour < cutoffHour}`);
          
          if (currentHour < cutoffHour) {
            dueDate = new Date(nzTime);
            addDebug(`Before cutoff - due date starts as TODAY: ${dueDate.toDateString()}`);
          } else {
            const tomorrow = new Date(nzTime);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDate = tomorrow;
            addDebug(`After cutoff - due date starts as TOMORROW: ${dueDate.toDateString()}`);
          }
          
          return isBwFilm ? await moveToNextBusinessDay(dueDate) : await moveToNextOperatingDay(dueDate);
          
        case '3day':
          if (isBwFilm) {
            addDebug(`3 Day B&W - adding 3 business days`);
            return await addBusinessDays(nzTime, 3);
          } else {
            addDebug(`3 Day C41 - adding 3 calendar days, then adjusting for holidays`);
            const threeDays = new Date(nzTime);
            threeDays.setDate(threeDays.getDate() + 3);
            addDebug(`After +3 days: ${threeDays.toDateString()}`);
            return await moveToNextOperatingDay(threeDays);
          }
          
        case '1week':
          if (isBwFilm) {
            addDebug(`1 Week B&W - adding 7 calendar days, then adjusting for business days`);
            const oneWeek = new Date(nzTime);
            oneWeek.setDate(oneWeek.getDate() + 7);
            addDebug(`After +7 days: ${oneWeek.toDateString()}`);
            const adjusted = await moveToNextBusinessDay(oneWeek);
            addDebug(`Final date after moving to next business day: ${adjusted.toDateString()}`);
            return adjusted;
          } else {
            addDebug(`1 Week C41 - adding 7 calendar days, then adjusting for holidays`);
            const oneWeek = new Date(nzTime);
            oneWeek.setDate(oneWeek.getDate() + 7);
            addDebug(`After +7 days: ${oneWeek.toDateString()}`);
            const adjusted = await moveToNextOperatingDay(oneWeek);
            addDebug(`Final date after moving to next operating day: ${adjusted.toDateString()}`);
            return adjusted;
          }
          
        default:
          const defaultDate = new Date(nzTime);
          defaultDate.setDate(defaultDate.getDate() + 1);
          return isBwFilm ? await moveToNextBusinessDay(defaultDate) : await moveToNextOperatingDay(defaultDate);
      }
    };

    const formatDate = (date) => {
      // Create a date string without timezone conversion to avoid UTC issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Parse the date components
      const dateObj = new Date(year, date.getMonth(), date.getDate());
      
      return dateObj.toLocaleDateString('en-NZ', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
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
      addDebug(`\n=== WEBHOOK TRIGGERED ===`);
      addDebug(`Processing ${data.line_items.length} line item(s)`);
      
      for (const lineItem of data.line_items) {
        const productId = lineItem.product?.id || '';
        addDebug(`\nLine item ID: ${lineItem.id}, Product ID: ${productId}`);
        
        if (isLabService(productId)) {
          addDebug(`✓ This is a lab service`);
          
          const alreadyHasDueDate = lineItem.custom_fields?.some(field => 
            field.name === 'film_due_date' && field.string_value
          );

          if (!alreadyHasDueDate) {
            const turnaroundType = getTurnaroundType(productId);
            const isBw = isBwFilm(productId);
            
            const dueDate = await calculateDueDate(turnaroundType, isBw);
            const dueDateFormatted = formatDate(dueDate);
            
            // Add holiday info to the due date display if applicable
            let dueDateDisplay = dueDateFormatted;
            if (holidayEncountered) {
              dueDateDisplay = `Scans due by end of: ${dueDateFormatted} (adjusted due to ${holidayEncountered})`;
            } else {
              dueDateDisplay = `Scans due by end of: ${dueDateFormatted}`;
            }
            
            addDebug(`\n✓ FINAL DUE DATE: ${dueDateDisplay}`);
            addDebug(`Holiday encountered: ${holidayEncountered || 'None'}`);
            addDebug(`Debug log:\n${debugLog.join('\n')}`);
            
            const nzTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Pacific/Auckland"}));
            const currentHour = nzTime.getHours();
            const currentDay = nzTime.getDay();
            const isWeekend = currentDay === 0 || currentDay === 6;
            const cutoffHour = isWeekend ? 13 : 14;
            
            let serviceLabel;
            if (turnaroundType === 'fast') {
              const cutoffText = isWeekend ? '1pm on weekends' : '2pm on weekdays';
              serviceLabel = currentHour < cutoffHour ? 
                (isBw ? `FAST - Today (before ${cutoffText}, next business day if holiday)` : `FAST - Today (before ${cutoffText}, next day if holiday)`) : 
                (isBw ? 'FAST - Tomorrow (next business day if holiday)' : 'FAST - Tomorrow (next day if holiday)');
            } else if (turnaroundType === '3day') {
              if (holidayEncountered) {
                serviceLabel = isBw ? 
                  `3 Business Days (adjusted due to ${holidayEncountered})` : 
                  `3 Days (adjusted due to ${holidayEncountered})`;
              } else {
                serviceLabel = isBw ? '3 Business Days (excluding weekends & holidays)' : '3 Days (adjusted for holidays only)';
              }
            } else {
              if (holidayEncountered) {
                serviceLabel = isBw ? 
                  `1 Week (adjusted due to ${holidayEncountered})` : 
                  `1 Week (adjusted due to ${holidayEncountered})`;
              } else {
                serviceLabel = isBw ? '1 Week (adjusted for business days)' : '1 Week (adjusted for holidays only)';
              }
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
                    custom_field_value: dueDateDisplay
                  }
                ],
                debug: {
                  log: debugLog,
                  finalDueDate: dueDateDisplay,
                  dueDateTime: dueDate.toISOString(),
                  holidayEncountered: holidayEncountered
                }
              })
            };
          } else {
            addDebug(`Already has due date, skipping`);
          }
        } else {
          addDebug(`✗ Not a lab service`);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ actions: [], debug: { log: debugLog } })
    };

  } catch (error) {
    console.log('ERROR:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
};
