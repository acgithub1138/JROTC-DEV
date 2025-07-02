export const getGradeColor = (grade: string): string => {
  const gradeNumber = parseInt(grade);
  switch (gradeNumber) {
    case 9:
      return 'bg-red-500 text-white'; // Freshman - Red
    case 10:
      return 'bg-green-500 text-white'; // Sophomore - Green
    case 11:
      return 'bg-blue-500 text-white'; // Junior - Blue
    case 12:
      return 'bg-black text-white'; // Senior - Black
    default:
      // Handle text-based grades
      const gradeLower = grade.toLowerCase();
      if (gradeLower.includes('freshman') || gradeLower === '9th') {
        return 'bg-red-500 text-white';
      } else if (gradeLower.includes('sophomore') || gradeLower === '10th') {
        return 'bg-green-500 text-white';
      } else if (gradeLower.includes('junior') || gradeLower === '11th') {
        return 'bg-blue-500 text-white';
      } else if (gradeLower.includes('senior') || gradeLower === '12th') {
        return 'bg-black text-white';
      }
      return 'bg-gray-500 text-white';
  }
};