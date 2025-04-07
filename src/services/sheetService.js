const SHEET_ID = '1UhfbVGLGTy2jLh6QSlsXmzfh9pJTdUIXYiB0UX5UqQA'; // Your actual Sheet ID
const API_KEY = 'AIzaSyBwKLOOXlGvnbMiXC9qH2B9yWsGZ4iPrj8'; // Your actual API Key

const transformYouTubeUrl = (url) => {
  // Handle different YouTube URL formats
  const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // If it's already an embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  return url;
};

export const fetchCourses = async () => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:F?key=${API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Sheets API Error:', errorData);
      throw new Error(`Failed to fetch data from Google Sheets: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (!data.values || data.values.length === 0) {
      throw new Error('No data found in the sheet');
    }
    
    return transformSheetData(data.values);
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

const transformSheetData = (values) => {
  // Skip header row
  const rows = values.slice(1);
  
  // Group data by course
  const courses = {};
  
  rows.forEach(row => {
    const [courseTitle, subtopicId, subtopicTitle, description, videoUrl, isRead] = row;
    
    if (!courses[courseTitle]) {
      courses[courseTitle] = {
        title: courseTitle,
        subtopics: []
      };
    }
    
    courses[courseTitle].subtopics.push({
      id: subtopicId,
      title: subtopicTitle,
      description: description,
      videoUrl: transformYouTubeUrl(videoUrl),
      isRead: isRead === 'TRUE'
    });
  });
  
  // Convert to array and add IDs
  return Object.values(courses).map((course, index) => ({
    id: `course-${index + 1}`,
    ...course
  }));
}; 