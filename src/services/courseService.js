import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const fetchCourses = async () => {
  try {
    const coursesCollection = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesCollection);
    
    return coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}; 