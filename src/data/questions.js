// Questions from Skinora Remedy Knowledge Base (remedies_and_advices.docx)
export const QUESTIONS = [
  {
    key: 'water',
    question: 'How many glasses of water do you drink daily?',
    category: 'Hydration',
    type: 'choice',
    options: ['Less than 4 glasses', '4–8 glasses', 'More than 8 glasses'],
  },
  {
    key: 'stress',
    question: 'How would you rate your stress level?',
    category: 'Stress',
    type: 'choice',
    options: ['Low', 'Medium', 'High'],
  },
  {
    key: 'sleep',
    question: 'How many hours of sleep do you get per night?',
    category: 'Recovery',
    type: 'choice',
    options: ['Less than 6 hours', '6–8 hours', 'More than 8 hours'],
  },
];

// Generate lifestyle advices based on questionnaire answers
export function generateAdvices(answers) {
  const advices = [];

  if (answers.water === 'Less than 4 glasses') {
    advices.push({ tag: 'low_water', icon: '💧', text: 'Drink at least 6–8 glasses of water daily to help maintain healthy skin hydration.' });
  } else if (answers.water === '4–8 glasses') {
    advices.push({ tag: 'normal_water', icon: '💧', text: 'Maintain your current hydration habits to support healthy skin.' });
  } else if (answers.water === 'More than 8 glasses') {
    advices.push({ tag: 'high_water', icon: '💧', text: 'Excellent hydration habits. Continue your current routine.' });
  }

  if (answers.stress === 'Low') {
    advices.push({ tag: 'low_stress', icon: '🧘', text: 'Your stress level appears well managed. Continue maintaining healthy lifestyle habits.' });
  } else if (answers.stress === 'Medium') {
    advices.push({ tag: 'medium_stress', icon: '🧘', text: 'Consider stress-management techniques such as walking, exercise, meditation, or breathing exercises.' });
  } else if (answers.stress === 'High') {
    advices.push({ tag: 'high_stress', icon: '🧘', text: 'High stress may negatively affect skin health. Regular stress-management activities are strongly recommended.' });
  }

  if (answers.sleep === 'Less than 6 hours') {
    advices.push({ tag: 'poor_sleep', icon: '🌙', text: 'Aim for 7–8 hours of quality sleep each night to support skin repair and recovery.' });
  } else if (answers.sleep === '6–8 hours') {
    advices.push({ tag: 'normal_sleep', icon: '🌙', text: 'Your sleep duration is generally adequate. Maintain a consistent sleep schedule.' });
  } else if (answers.sleep === 'More than 8 hours') {
    advices.push({ tag: 'good_sleep', icon: '🌙', text: 'Excellent sleep habits. Continue maintaining healthy sleep patterns.' });
  }

  return advices;
}

export function summariseLifestyle(answers) {
  return {
    high_stress: answers.stress === 'High',
    low_water:   answers.water === 'Less than 4 glasses',
    poor_sleep:  answers.sleep === 'Less than 6 hours',
  };
}
