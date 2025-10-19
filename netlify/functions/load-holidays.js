// Utility function to load holidays from Netlify Blobs
// Import this in your main webhook

const { getStore } = require('@netlify/blobs');

async function loadHolidaysFromBlob() {
  try {
    const store = getStore('nz-holidays');
    const data = await store.get('holidays');
    
    if (!data) {
      console.log('No holidays data found in Blobs, returning empty array');
      return [];
    }
    
    const holidaysData = JSON.parse(data);
    console.log(`Loaded holidays from Blobs, last updated: ${holidaysData.lastUpdated}`);
    return holidaysData.allHolidays || [];
  } catch (error) {
    console.error(`Error loading holidays from Blobs: ${error.message}`);
    return [];
  }
}

module.exports = { loadHolidaysFromBlob };
