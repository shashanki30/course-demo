import { toast } from 'react-hot-toast';

const SHEET_ID = '1UhfbVGLGTy2jLh6QSlsXmzfh9pJTdUIXYiB0UX5UqQA';
const SHEET2_NAME = 'Sheet2';
const SHEET1_NAME = 'Sheet1';
const SHEET2_RANGE = 'A:D';
const SHEET1_RANGE = 'A:Z';

async function getAccessToken() {
  const token = localStorage.getItem('googleAccessToken');
  const userData = localStorage.getItem('user');

  if (!token) {
    throw new Error('No access token found');
  }
  
  if (!userData) {
    throw new Error('No user data found');
  }

  try {
    const user = JSON.parse(userData);
    if (!user || !user.email) {
      throw new Error('Invalid user data');
    }
    return token;
  } catch (error) {
    console.error('Error parsing user data:', error);
    throw new Error('Invalid user data');
  }
}

async function checkUserExists(email) {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET2_NAME}!C:C`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (response.status === 401) {
      localStorage.removeItem('googleAccessToken');
      window.location.href = '/login';
      throw new Error('Access token expired. Please login again.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    const values = data.values || [];
    return values.some(row => row[0] === email);
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
}

async function updateSheet2(userData) {
  try {
    const accessToken = await getAccessToken();

    const userExists = await checkUserExists(userData.email);
    if (userExists) {
      console.log('User already exists in Sheet2');
      return true;
    }

    const date = new Date().toISOString();
    const values = [[
      date,
      userData.name,
      userData.email,
      userData.picture || ''
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET2_NAME}!${SHEET2_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: values,
          majorDimension: "ROWS"
        })
      }
    );

    if (response.status === 401) {
      localStorage.removeItem('googleAccessToken');
      window.location.href = '/login';
      throw new Error('Access token expired. Please login again.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    console.log('Successfully updated Sheet2');
    return true;
  } catch (error) {
    console.error('Error updating Sheet2:', error);
    throw error;
  }
}

export async function saveUserData(userData) {
  try {
    await updateSheet2(userData);
    return true;
  } catch (error) {
    console.error('Error in saveUserData:', error);
    throw error;
  }
}

export async function getSheetData() {
  try {
    const accessToken = localStorage.getItem('googleAccessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET2_NAME}!${SHEET2_RANGE}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.message?.includes('429') && retries < maxRetries - 1) {
        retries++;
        console.log(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
};

export const getCourseData = async () => {
  try {
    const token = await getAccessToken();

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET1_NAME}!${SHEET1_RANGE}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('googleAccessToken');
        throw new Error('401');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const values = data.values || [];

    // Get the current user's email
    const user = JSON.parse(localStorage.getItem('user'));
    const userEmail = user?.email;

    if (!userEmail) {
      throw new Error('No user email found');
    }

    // Get the column index for the user's email
    const headerRow = values[0] || [];
    const userColumnIndex = headerRow.findIndex(email => email === userEmail);

    // Group subtopics under main topics
    const courseData = values.slice(1).reduce((acc, row) => {
      const mainTopic = row[0] || '';
      if (!mainTopic) return acc;

      // Get the access status for this row
      const accessStatus = userColumnIndex >= 0 ? row[userColumnIndex] : 'Access Given';

      // Skip if no access
      if (accessStatus === 'No access') {
        return acc;
      }

      // Split the subtitles, videoIds, descriptions, and videoUrls by comma
      const subtitles = (row[1] || '').split(',').map(s => s.trim());
      const videoIds = (row[2] || '').split(',').map(s => s.trim());
      const descriptions = (row[3] || '').split(',').map(s => s.trim());
      const videoUrls = (row[4] || '').split(',').map(s => s.trim());

      // Find existing topic or create new one
      let existingTopic = acc.find(item => item.mainTopic === mainTopic);
      if (!existingTopic) {
        existingTopic = {
          mainTopic,
          subtitles: [],
          accessStatus
        };
        acc.push(existingTopic);
      }

      // Add subtopics to the existing topic
      subtitles.forEach((subtitle, index) => {
        if (subtitle && !existingTopic.subtitles.some(s => s.subtitle === subtitle)) {
          existingTopic.subtitles.push({
            subtitle,
            videoId: videoIds[index] || '',
            description: descriptions[index] || '',
            url: videoUrls[index] || '',
            isCompleted: accessStatus === 'Finish'
          });
        }
      });

      return acc;
    }, []);

    return courseData;
  } catch (error) {
    console.error('Error fetching course data:', error);
    throw error;
  }
};

// Mock data for demonstration
const mockCourseData = {
  id: 1,
  title: "Introduction to Web Development",
  subtitles: [
    {
      id: 1,
      title: "Getting Started with HTML",
      description: "Learn the basics of HTML structure and elements",
      youtube_path: "https://www.youtube.com/embed/example1",
      is_read: false
    },
    {
      id: 2,
      title: "CSS Fundamentals",
      description: "Understanding CSS properties and styling",
      youtube_path: "https://www.youtube.com/embed/example2",
      is_read: false
    },
    {
      id: 3,
      title: "JavaScript Basics",
      description: "Introduction to JavaScript programming",
      youtube_path: "https://www.youtube.com/embed/example3",
      is_read: false
    }
  ]
};

export const userService = {
  getCourseById: async (courseId) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockCourseData);
      }, 500);
    });
  },

  markSubtitleAsRead: async (courseId, subtitleId) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 300);
    });
  }
};

export const updateUserEmail = async (email) => {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    // Get the current sheet data to find the last row and column
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET1_NAME}!${SHEET1_RANGE}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const values = data.values || [];
    
    // Find the last column (E is the last column in SHEET1_RANGE)
    const nextColumnLetter = 'F';
    
    // Prepare the update request with valueInputOption
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET1_NAME}!${nextColumnLetter}1:${nextColumnLetter}${values.length}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${SHEET1_NAME}!${nextColumnLetter}1:${nextColumnLetter}${values.length}`,
          majorDimension: "ROWS",
          values: [
            [email], // Use email as header
            ...Array(values.length - 2).fill(['Access Given']), // Default value for all rows
            ['Access Given'] // Last row with default value
          ]
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Sheet update error:', errorData);
      throw new Error(`Failed to update email: ${updateResponse.status}`);
    }

    // Add data validation for the dropdown
    const validationResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            setDataValidation: {
              range: {
                sheetId: 0, // Assuming Sheet1 is the first sheet
                startRowIndex: 1, // Start from row 2 (after header)
                endRowIndex: values.length,
                startColumnIndex: 5, // Column F
                endColumnIndex: 6
              },
              rule: {
                condition: {
                  type: 'ONE_OF_LIST',
                  values: [
                    { userEnteredValue: 'Access Given' },
                    { userEnteredValue: 'No access' },
                    { userEnteredValue: 'Finish' }
                  ]
                },
                showCustomUi: true,
                strict: true
              }
            }
          }]
        }),
      }
    );

    if (!validationResponse.ok) {
      console.error('Failed to add data validation');
    }

    return true;
  } catch (error) {
    console.error('Error updating user email:', error);
    throw error;
  }
};

// Add new function to update completion status in the sheet
export const updateCompletionStatus = async (mainTopic, videoId, isCompleted) => {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    // Get the current sheet data
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET1_NAME}!${SHEET1_RANGE}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const values = data.values || [];

    // Get the current user's email - Fix the localStorage key
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.email) {
      console.log('No user data found, redirecting to login');
      window.location.href = '/login';
      return false;
    }

    // Find the row and column indices
    const headerRow = values[0] || [];
    const userColumnIndex = headerRow.findIndex(email => email === user.email);

    // If user's column doesn't exist, return without error
    if (userColumnIndex === -1) {
      console.log('User column not found, skipping update');
      return true;
    }

    // Find the row with matching mainTopic and videoId
    const rowIndex = values.findIndex(row => {
      if (!row || row.length < 3) return false;
      const rowMainTopic = row[0];
      const rowVideoIds = (row[2] || '').split(',').map(s => s.trim());
      return rowMainTopic === mainTopic && rowVideoIds.includes(videoId);
    });

    if (rowIndex === -1) {
      console.log('Topic or video not found, skipping update');
      return true;
    }

    // Update the status in the sheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET1_NAME}!${String.fromCharCode(65 + userColumnIndex)}${rowIndex + 1}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[isCompleted ? 'Finish' : 'Access Given']]
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update completion status: ${updateResponse.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating completion status:', error);
    if (error.message.includes('No access token')) {
      window.location.href = '/login';
    }
    throw error;
  }
}; 