// Utility function to load holidays from the JSON file
// Import this in your main webhook

const fs = require('fs').promises;
const path = require('path');

async function loadHolidaysFromFile() {
  try {
    const holidaysPath = path.join(__dirname, 'holidays.json');
    const data = await fs.readFile(holidaysPath, 'utf8');
    const holidaysData = JSON.parse(data);
    console.log(`Loaded holidays from file, last updated: ${holidaysData.lastUpdated}`);
    return holidaysData.allHolidays || [];
  } catch (error) {
    console.error(`Error loading holidays.json: ${error.message}`);
    return [];
  }
}

module.exports = { loadHolidaysFromFile };
