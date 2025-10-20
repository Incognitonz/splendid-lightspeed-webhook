let cachedHolidays = null;

// Utility function to load holidays from GitHub raw content
async function loadHolidaysFromGitHub() {
  try {
    // If already cached in memory, return it
    if (cachedHolidays) {
      console.log(`Using in-memory cached holidays`);
      return cachedHolidays;
    }

    // GitHub raw content URL
    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Incognitonz/splendid-lightspeed-webhook/main/netlify/functions/holidays.json';
    
    console.log(`Fetching holidays from GitHub: ${GITHUB_RAW_URL}`);
    
    const response = await fetch(GITHUB_RAW_URL);
    
    if (!response.ok) {
      console.error(`GitHub returned status ${response.status}`);
      return [];
    }

    const holidaysData = await response.json();
    
    // Check the correctly nested path
    if (!holidaysData.holidaysData || !holidaysData.holidaysData.allHolidays || holidaysData.holidaysData.allHolidays.length === 0) {
      console.log('No holidays found in GitHub file at holidaysData.allHolidays');
      return [];
    }

    // Cache the correct nested array
    cachedHolidays = holidaysData.holidaysData.allHolidays;
    
    // Log using the nested lastUpdated field
    console.log(`Loaded ${cachedHolidays.length} holidays from GitHub (last updated: ${holidaysData.holidaysData.lastUpdated})`);
    return cachedHolidays;

  } catch (error) {
    console.error(`Error loading holidays from GitHub: ${error.message}`);
    return [];
  }
}

module.exports = {
  loadHolidaysFromGitHub
};
