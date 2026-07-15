// ── Lifestyle questions (always shown) ────────────────────────────────────────
export const LIFESTYLE_QUESTIONS = [
  {
    key: 'water',
    question: 'How many glasses of water do you drink daily?',
    category: 'Hydration',
    options: ['Less than 4 glasses', '4–8 glasses', 'More than 8 glasses'],
    group: 'lifestyle',
  },
  {
    key: 'stress',
    question: 'How would you rate your current stress level?',
    category: 'Stress',
    options: ['Low', 'Medium', 'High'],
    group: 'lifestyle',
  },
  {
    key: 'sleep',
    question: 'How many hours of sleep do you get per night?',
    category: 'Recovery',
    options: ['Less than 6 hours', '6–8 hours', 'More than 8 hours'],
    group: 'lifestyle',
  },
  {
    key: 'skincare_products',
    question: 'Do you currently use any skincare products?',
    category: 'Skincare',
    options: ['Yes', 'No'],
    group: 'lifestyle',
  },
  {
    key: 'dairy',
    question: 'Do you regularly consume dairy products?',
    category: 'Diet',
    options: ['Yes', 'No'],
    group: 'lifestyle',
  },
];

// ── Skin-type validation question (one, selected by AI prediction) ─────────────
const SKIN_VALIDATION = {
  Oily: {
    key: 'skin_oily_midday',
    question: 'How oily does your skin feel by midday?',
    category: 'Skin Validation',
    options: ['Very oily', 'Slightly oily', 'Not oily'],
    group: 'validation',
  },
  Dry: {
    key: 'skin_dry_after_wash',
    question: 'Does your skin feel dry or tight after washing?',
    category: 'Skin Validation',
    options: ['Always', 'Sometimes', 'Never'],
    group: 'validation',
  },
  Normal: {
    key: 'skin_general_description',
    question: 'How would you describe your skin texture overall?',
    category: 'Skin Validation',
    options: ['Balanced', 'Sometimes oily', 'Sometimes dry'],
    group: 'validation',
  },
};

// ── Acne validation questions (always shown) ───────────────────────────────────
export const ACNE_QUESTIONS = [
  {
    key: 'pimples_last_month',
    question: 'How often have you experienced pimples in the last month?',
    category: 'Acne Validation',
    options: ['Frequently', 'Occasionally', 'Rarely', 'Never'],
    group: 'validation',
  },
  {
    key: 'pimples_current_count',
    question: 'Approximately how many pimples are currently visible on your face?',
    category: 'Acne Validation',
    options: ['None', '1–5', '6–15', 'More than 15'],
    group: 'validation',
  },
];

/** Return the full ordered question list for the given AI-predicted skin type. */
export function getQuestions(skin_type = 'Normal') {
  const skinQ = SKIN_VALIDATION[skin_type] ?? SKIN_VALIDATION.Normal;
  return [...LIFESTYLE_QUESTIONS, skinQ, ...ACNE_QUESTIONS];
}

// Keep the old export alias for any code that still imports QUESTIONS
export const QUESTIONS = getQuestions('Normal');

/**
 * Calculate how well the user's self-reported answers support the AI prediction.
 * Skin type: max 2 pts.  Acne (frequency + count): max 4 pts.  Total max: 6.
 */
export function calculateValidationScore(answers, skin_type, acne_status) {
  let score = 0;
  const MAX = 6;
  const skin    = (skin_type   || '').trim();
  const hasAcne = (acne_status || '').trim() === 'Acne';

  // Skin type (max 2)
  if (skin === 'Oily') {
    if (answers.skin_oily_midday === 'Very oily')      score += 2;
    else if (answers.skin_oily_midday === 'Slightly oily') score += 1;
  } else if (skin === 'Dry') {
    if (answers.skin_dry_after_wash === 'Always')      score += 2;
    else if (answers.skin_dry_after_wash === 'Sometimes') score += 1;
  } else {
    if (answers.skin_general_description === 'Balanced')                             score += 2;
    else if (['Sometimes oily','Sometimes dry'].includes(answers.skin_general_description)) score += 1;
  }

  // Acne frequency (max 2)
  const freq = answers.pimples_last_month;
  if (hasAcne) {
    if (freq === 'Frequently')   score += 2;
    else if (freq === 'Occasionally') score += 1;
  } else {
    if (freq === 'Never')  score += 2;
    else if (freq === 'Rarely') score += 1;
  }

  // Acne count (max 2)
  const count = answers.pimples_current_count;
  if (hasAcne) {
    if (['6–15','More than 15'].includes(count)) score += 2;
    else if (count === '1–5')                    score += 1;
  } else {
    if (count === 'None')  score += 2;
    else if (count === '1–5') score += 1;
  }

  let status;
  if (score >= 5)      status = 'Strongly Supports Prediction';
  else if (score >= 3) status = 'Moderately Supports Prediction';
  else                 status = 'Weakly Supports Prediction';

  return { score, maxScore: MAX, status };
}

/** Generate personalised lifestyle advice from questionnaire answers. */
export function generateAdvices(answers) {
  const advices = [];

  // Water
  if (answers.water === 'Less than 4 glasses')
    advices.push({ tag: 'low_water',    icon: '💧', text: 'Drink at least 6–8 glasses of water daily to maintain healthy skin hydration.' });
  else if (answers.water === '4–8 glasses')
    advices.push({ tag: 'normal_water', icon: '💧', text: 'Maintain your current hydration habits to support healthy skin.' });
  else if (answers.water === 'More than 8 glasses')
    advices.push({ tag: 'high_water',   icon: '💧', text: 'Excellent hydration habits — keep up your current routine.' });

  // Stress
  if (answers.stress === 'High')
    advices.push({ tag: 'high_stress',   icon: '🧘', text: 'High stress can affect skin health. Try walking, exercise, meditation, or breathing exercises regularly.' });
  else if (answers.stress === 'Medium')
    advices.push({ tag: 'medium_stress', icon: '🧘', text: 'Consider adding simple stress-management habits such as short walks or mindfulness sessions.' });
  else if (answers.stress === 'Low')
    advices.push({ tag: 'low_stress',    icon: '🧘', text: 'Great — your stress level is well managed. Keep up these healthy habits.' });

  // Sleep
  if (answers.sleep === 'Less than 6 hours')
    advices.push({ tag: 'poor_sleep',   icon: '🌙', text: 'Aim for 7–8 hours of quality sleep each night to support skin repair and recovery.' });
  else if (answers.sleep === '6–8 hours')
    advices.push({ tag: 'normal_sleep', icon: '🌙', text: 'Your sleep duration is adequate. Maintain a consistent sleep schedule.' });
  else if (answers.sleep === 'More than 8 hours')
    advices.push({ tag: 'good_sleep',   icon: '🌙', text: 'Excellent sleep habits — continue maintaining healthy sleep patterns.' });

  // Skincare products
  if (answers.skincare_products === 'Yes')
    advices.push({ tag: 'uses_products', icon: '✨', text: 'Good that you use skincare products. Ensure they are suited to your detected skin type.' });
  else if (answers.skincare_products === 'No')
    advices.push({ tag: 'no_products',   icon: '✨', text: 'A simple skincare routine suited to your skin type may help improve your condition.' });

  // Dairy
  if (answers.dairy === 'Yes')
    advices.push({ tag: 'dairy',    icon: '🥛', text: 'Dairy can affect skin in some individuals. Monitor whether dairy intake influences your skin.' });
  else if (answers.dairy === 'No')
    advices.push({ tag: 'no_dairy', icon: '🥛', text: 'Avoiding dairy may positively support your skin health.' });

  return advices;
}

export function summariseLifestyle(answers) {
  return {
    high_stress:   answers.stress === 'High',
    low_water:     answers.water  === 'Less than 4 glasses',
    poor_sleep:    answers.sleep  === 'Less than 6 hours',
    dairy_user:    answers.dairy  === 'Yes',
    uses_products: answers.skincare_products === 'Yes',
  };
}
