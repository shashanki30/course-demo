const SHEET_ID = '1UhfbVGLGTy2jLh6QSlsXmzfh9pJTdUIXYiB0UX5UqQA';
const API_KEY = 'AIzaSyBwKLOOXlGvnbMiXC9qH2B9yWsGZ4iPrj8';

export const updateUserDetails = async (userData) => {
  try {
    // Prepare the data for Sheet 2
    const sheetData = {
      values: [[
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.emailVerified ? 'TRUE' : 'FALSE',
        userData.picture,
        userData.courseId,
        userData.subtopicId,
        new Date().toISOString()
      ]]
    };

    console.log('Attempting to update Sheet 2 with user details:', sheetData);

    // Use the API key for public access - this will work if the sheet is shared publicly
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet2!A:H:append?valueInputOption=RAW&key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(sheetData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API Error:', errorData);
      throw new Error(`Failed to update user details: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('Sheet 2 update response:', result);
    return result;
  } catch (error) {
    console.error('Error updating user details:', error);
    throw error;
  }
}; 