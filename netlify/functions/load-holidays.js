// Utility function to load holidays from GitHub raw content

let cachedHolidays = null;

async function loadHolidaysFromGitHub() {
  try {
    // If already cached in memory, return it
    if (cachedHolidays) {
      console.log(`Using in-memory cached holidays`);
      return cachedHolidays;
    }

    // GitHub raw content URL - update the username/repo/branch as needed
    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/splendid-tools/splendid-lightspeed-webhook/main/netlify/holidays.json';
    
    console.log(`Fetching holidays from GitHub: ${GITHUB_RAW_URL}`);
    
    const response = await fetch(GITHUB_RAW_URL);
    
    if (!response.ok) {
      console.error(`GitHub returned status ${response.status}`);
      return [];
    }

    const holidaysData = await response.json();
    
    if (!holidaysData.allHolidays || holidaysData.allHolidays.length === 0) {
      console.log('No holidays found in GitHub file');
      return [];
    }

    // Cache in memory for this function execution
    cachedHolidays = holidaysData.allHolidays;
    
    console.log(`Loaded ${cachedHolidays.length} holidays from GitHub (last updated: ${holidaysData.lastUpdated})`);
    return cachedHolidays;
  } catch (error) {
    console.error(`Error loading holidays from GitHub: ${error.message}`);
    return [];
  }
}

module.exports = { loadHolidaysFromGitHub };
