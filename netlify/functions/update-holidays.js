// Run this function once a year to update the holidays in Netlify Blobs
// Trigger via: curl -X POST https://your-netlify-domain/.netlify/functions/update-holidays

const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const HOLIDAYS_API_KEY = 'b122addcbe0a49fb9755318d5edc5c62';
    const HOLIDAYS_API_URL = 'https://api.public-holidays.nz/v1';
    
    // Get current year and next year
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    console.log(`Fetching holidays for ${currentYear} and ${nextYear}`);
    
    // Fetch holidays for both current and next year
    const [currentYearHolidays, nextYearHolidays] = await Promise.all([
      fetch(`${HOLIDAYS_API_URL}/year?apikey=${HOLIDAYS_API_KEY}&year=${currentYear}`).then(r => r.json()),
      fetch(`${HOLIDAYS_API_URL}/year?apikey=${HOLIDAYS_API_KEY}&year=${nextYear}`).then(r => r.json())
    ]);
    
    // Combine both years
    const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
    
    // Create the holidays data structure
    const holidaysData = {
      lastUpdated: new Date().toISOString(),
      years: {
        [currentYear]: currentYearHolidays,
        [nextYear]: nextYearHolidays
      },
      allHolidays: allHolidays
    };
    
    console.log(`Fetched ${currentYearHolidays.length} holidays for ${currentYear}`);
    console.log(`Fetched ${nextYearHolidays.length} holidays for ${nextYear}`);
    
    // Save to Netlify Blobs
    const store = getStore('nz-holidays');
    await store.set('holidays', JSON.stringify(holidaysData));
    
    console.log(`Successfully updated holidays in Netlify Blobs`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Updated holidays for ${currentYear} and ${nextYear}`,
        totalHolidays: allHolidays.length,
        currentYearCount: currentYearHolidays.length,
        nextYearCount: nextYearHolidays.length,
        lastUpdated: holidaysData.lastUpdated
      })
    };
    
  } catch (error) {
    console.error('ERROR:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    };
  }
};
