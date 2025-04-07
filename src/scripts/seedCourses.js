const { collection, addDoc } = require('firebase/firestore');
const { db } = require('../firebase/config');

const courses = [
  {
    title: 'Introduction to React',
    subtopics: [
      {
        id: '1-1',
        title: 'Getting Started with React',
        description: 'Learn the basics of React, including components, props, and state management.',
        videoUrl: 'https://www.youtube.com/embed/7CqJlxBYj-M'
      },
      {
        id: '1-2',
        title: 'React Hooks',
        description: 'Understanding and implementing React Hooks for functional components.',
        videoUrl: 'https://www.youtube.com/embed/9xhKH43llhU'
      },
      {
        id: '1-3',
        title: 'React Router',
        description: 'Implementing navigation and routing in React applications.',
        videoUrl: 'https://www.youtube.com/embed/0cSVuySEB0A'
      }
    ]
  },
  {
    title: 'Advanced JavaScript',
    subtopics: [
      {
        id: '2-1',
        title: 'ES6+ Features',
        description: 'Exploring modern JavaScript features and syntax.',
        videoUrl: 'https://www.youtube.com/embed/NCwa_xi0Uuc'
      },
      {
        id: '2-2',
        title: 'Async Programming',
        description: 'Understanding asynchronous programming in JavaScript.',
        videoUrl: 'https://www.youtube.com/embed/8aGhZQko6bQ'
      }
    ]
  },
  {
    title: 'CSS and Styling',
    subtopics: [
      {
        id: '3-1',
        title: 'CSS Grid',
        description: 'Mastering CSS Grid layout system.',
        videoUrl: 'https://www.youtube.com/embed/9zBsdzdE4sM'
      },
      {
        id: '3-2',
        title: 'Flexbox',
        description: 'Understanding and implementing Flexbox layouts.',
        videoUrl: 'https://www.youtube.com/embed/JJSoEo8JSnc'
      }
    ]
  }
];

const seedCourses = async () => {
  try {
    console.log('Starting course seeding...');
    const coursesCollection = collection(db, 'courses');
    
    for (const course of courses) {
      try {
        await addDoc(coursesCollection, course);
        console.log(`✓ Added course: ${course.title}`);
      } catch (courseError) {
        console.error(`✗ Error adding course ${course.title}:`, courseError.message);
      }
    }
    
    console.log('\nCourse seeding completed successfully!');
    console.log(`Added ${courses.length} courses with ${courses.reduce((acc, course) => acc + course.subtopics.length, 0)} subtopics.`);
  } catch (error) {
    console.error('\nError during course seeding:', error.message);
    process.exit(1);
  }
};

// Run the seeding function
seedCourses(); 