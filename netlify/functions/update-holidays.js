// Run this function once a year to update the holidays JSON
// You can trigger it manually via netlify function invocation or set up a scheduled function
const fs = require('fs').promises;
const path = require('path');

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
    
    // Save to holidays.json in the functions directory
    const holidaysPath = path.join(__dirname, 'holidays.json');
    await fs.writeFile(holidaysPath, JSON.stringify(holidaysData, null, 2));
    
    console.log(`Successfully updated holidays.json`);
    
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
