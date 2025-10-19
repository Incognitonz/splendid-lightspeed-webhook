// Run this once a year to update the holidays.json file on GitHub
// You can trigger it manually or via a scheduled function

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
    
    // Return the data so you can manually copy it to your GitHub holidays.json file
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Generated holidays for ${currentYear} and ${nextYear}. Copy the "holidaysData" object below to your netlify/holidays.json file on GitHub.`,
        totalHolidays: allHolidays.length,
        currentYearCount: currentYearHolidays.length,
        nextYearCount: nextYearHolidays.length,
        holidaysData: holidaysData
      }, null, 2)
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
