import { 
  PatientProfile, 
  CaretakerProfile, 
  Medication, 
  CognitiveMetrics, 
  GameMetadata, 
  FamilyMember, 
  AlertItem, 
  FamilyStory,
  GameScoreResult
} from '../types';

export const DEMO_DATA_DISCLAIMER = {
  label: 'Demo Activity Data',
  notice: 'Demo Activity Data — For prototype visualization only. Not real patient medical or cognitive measurements.',
  nonDiagnosticDisclaimer: 'These insights are for tracking activity and cognitive performance patterns and are not a medical diagnosis.'
};

export const INITIAL_PATIENT: PatientProfile = {
  id: 'patient-001',
  name: 'Arun',
  email: 'arun.sharma72@example.com',
  phone: '+91 98765 43210',
  gender: 'Male',
  age: 72,
  photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  primaryLanguage: 'en-IN',
  fallbackLanguage: 'hi-IN',
  caretakerId: 'caretaker-001',
  caretakerName: 'Priya Sharma',
  emergencyContact: {
    name: 'Priya Sharma',
    relationship: 'Daughter',
    phone: '+91 98765 11223'
  }
};

export const INITIAL_CARETAKER: CaretakerProfile = {
  id: 'caretaker-001',
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  phone: '+91 98765 11223',
  relationshipToPatient: 'Daughter',
  photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  language: 'en-IN'
};

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-1',
    name: 'Priya Sharma',
    relationship: 'Daughter (Caregiver)',
    phone: '+91 98765 11223',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    notes: 'Calls every morning at 8:30 AM before breakfast.'
  },
  {
    id: 'fam-2',
    name: 'Rohan Sharma',
    relationship: 'Grandson',
    phone: '+91 98765 88990',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    notes: 'Loves playing the Cup Shuffle game with Dadaji on Sundays.'
  },
  {
    id: 'fam-3',
    name: 'Maya Sharma',
    relationship: 'Daughter-in-law',
    phone: '+91 98765 44332',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    notes: 'Prepares favorite Assam tea and fresh fruits.'
  }
];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Donepezil',
    dosage: '1 tablet (5mg)',
    scheduleTime: '9:00 AM',
    timeCategory: 'morning',
    remainingQuantity: 18,
    totalQuantity: 30,
    takenStatus: 'taken',
    takenAt: '9:05 AM today',
    photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
    instructions: 'Take 1 tablet with a glass of warm water right after breakfast.',
    prescribedBy: 'Dr. K. Nair (Neurologist)'
  },
  {
    id: 'med-2',
    name: 'Vitamin D3',
    dosage: '1 capsule (1000 IU)',
    scheduleTime: '1:00 PM',
    timeCategory: 'afternoon',
    remainingQuantity: 24,
    totalQuantity: 30,
    takenStatus: 'pending',
    photoUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=200&auto=format&fit=crop&q=80',
    instructions: 'Take 1 golden capsule with lunch meal.',
    prescribedBy: 'Dr. S. Verma'
  },
  {
    id: 'med-3',
    name: 'Memantine (Medication C)',
    dosage: '1 tablet (10mg)',
    scheduleTime: '8:00 PM',
    timeCategory: 'evening',
    remainingQuantity: 12,
    totalQuantity: 30,
    takenStatus: 'pending',
    photoUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&auto=format&fit=crop&q=80',
    instructions: 'Take 1 tablet after dinner before bedtime.',
    prescribedBy: 'Dr. K. Nair (Neurologist)'
  },
  {
    id: 'med-4',
    name: 'Omega-3 Fish Oil',
    dosage: '1 softgel',
    scheduleTime: '9:00 PM',
    timeCategory: 'night',
    remainingQuantity: 20,
    totalQuantity: 30,
    takenStatus: 'pending',
    photoUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&auto=format&fit=crop&q=80',
    instructions: 'Take 1 softgel with warm milk.',
    prescribedBy: 'Dr. S. Verma'
  }
];

export const INITIAL_COGNITIVE_METRICS: CognitiveMetrics = {
  attention: 78,
  memory: 72,
  patternRecognition: 81,
  overallScore: 77,
  trend: 'improving',
  weeklyActivityMinutes: 145,
  gamesPlayedToday: 2,
  sessionsCompleted: 4,
  lastPlayedAt: 'Today, 11:30 AM'
};

export const CORE_GAMES: GameMetadata[] = [
  {
    id: 'groceries',
    name: 'Groceries Shopping',
    category: 'Memory',
    shortDescription: 'Remember the items on the fresh shopping list and pick them from the store shelves.',
    iconName: 'ShoppingBag',
    colorScheme: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      text: 'text-emerald-900 dark:text-emerald-100',
      accent: 'emerald'
    },
    durationEstimate: '3–5 mins'
  },
  {
    id: 'routine',
    name: 'Daily Routine in Sequence',
    category: 'Executive Function',
    shortDescription: 'Arrange everyday morning and daytime activities in their natural chronological order.',
    iconName: 'ListOrdered',
    colorScheme: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      text: 'text-amber-900 dark:text-amber-100',
      accent: 'amber'
    },
    durationEstimate: '2–4 mins'
  },
  {
    id: 'cup_shuffle',
    name: 'Cup Shuffle',
    category: 'Attention & Focus',
    shortDescription: 'Follow the wooden cups closely as they swap positions and locate the hidden golden coin.',
    iconName: 'Eye',
    colorScheme: {
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      border: 'border-teal-200 dark:border-teal-800',
      badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
      text: 'text-teal-900 dark:text-teal-100',
      accent: 'teal'
    },
    durationEstimate: '2–3 mins'
  },
  {
    id: 'cultural_match',
    name: 'Cultural Memory Match',
    category: 'Cultural Memory',
    shortDescription: 'Turn over cards to pair up festive lamps, musical instruments, chai cups, and heritage symbols.',
    iconName: 'Sparkles',
    colorScheme: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      text: 'text-purple-900 dark:text-purple-100',
      accent: 'purple'
    },
    durationEstimate: '4–6 mins'
  },
  {
    id: 'family_stories',
    name: 'Family Memories & Stories',
    category: 'Storytelling & Speech',
    shortDescription: 'Speak warmly into your microphone to record cherished memories, festival joys, and life reflections.',
    iconName: 'Mic',
    colorScheme: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      text: 'text-rose-900 dark:text-rose-100',
      accent: 'rose'
    },
    durationEstimate: '3–10 mins'
  }
];

export const INITIAL_AI_INSIGHTS = [
  {
    id: 'ai-1',
    title: 'Memory Trend Improving',
    description: 'Memory-game performance has improved this week by 8%, especially in the Groceries game.',
    category: 'positive',
    icon: 'TrendingUp',
    date: 'Today, 9:30 AM'
  },
  {
    id: 'ai-2',
    title: 'Active Daily Engagement',
    description: 'The patient has been completing more sessions consistently in the morning between 10:00 AM and 11:30 AM.',
    category: 'engagement',
    icon: 'CalendarCheck',
    date: 'Yesterday'
  },
  {
    id: 'ai-3',
    title: 'Attention Performance Stable',
    description: 'Attention performance is stable with high accuracy (85%+) in the Cup Shuffle game.',
    category: 'stable',
    icon: 'Activity',
    date: '2 days ago'
  },
  {
    id: 'ai-4',
    title: 'Supportive Routine Observation',
    description: 'Daily routine sequencing was completed on the first try with zero hints used.',
    category: 'positive',
    icon: 'Sparkles',
    date: '3 days ago'
  }
];

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alt-1',
    type: 'medication_reminder',
    title: 'Vitamin D3 Reminder',
    message: 'Time for your 1:00 PM Vitamin D3 capsule with lunch.',
    time: '1:00 PM',
    unread: true,
    priority: 'high',
    actionScreen: 'patient_meds'
  },
  {
    id: 'alt-2',
    type: 'game_reminder',
    title: 'Afternoon Brain Break',
    message: 'Ready for a quick 3-minute Cup Shuffle game?',
    time: '11:15 AM',
    unread: false,
    priority: 'normal',
    actionScreen: 'patient_games'
  },
  {
    id: 'alt-3',
    type: 'encouragement',
    title: 'Great Job on Morning Meds!',
    message: 'You took your Donepezil tablet on time at 9:05 AM. Well done!',
    time: '9:06 AM',
    unread: false,
    priority: 'normal',
    actionScreen: 'patient_meds'
  }
];

export const INITIAL_STORIES: FamilyStory[] = [
  {
    id: 'story-1',
    title: 'Bihu Festival in Guwahati (1978)',
    prompt: 'Tell me about a family celebration.',
    audioDurationSeconds: 142,
    recordedAt: 'Yesterday, 4:15 PM',
    transcript: 'We gathered in the courtyard in Guwahati under the huge mango tree. The whole neighborhood came with fresh pitha and tea. We sang traditional songs until the evening lights came on.',
    photoUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=300&auto=format&fit=crop&q=80',
    tags: ['Bihu', 'Guwahati', 'Family', 'Celebration']
  },
  {
    id: 'story-2',
    title: 'First Trip to Shillong Peak',
    prompt: 'What is a happy memory you remember?',
    audioDurationSeconds: 98,
    recordedAt: '3 days ago',
    transcript: 'The pine trees smelled so fresh. Priya was only 5 years old and was holding a yellow pinwheel running up the hill.',
    photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80',
    tags: ['Shillong', 'Priya', 'Travel']
  }
];

export const INITIAL_GAME_HISTORY: GameScoreResult[] = [
  {
    gameId: 'groceries',
    score: 95,
    attempts: 1,
    mistakes: 0,
    hintsUsed: 0,
    timeSpentSeconds: 48,
    timestamp: 'Today, 10:45 AM',
    difficulty: 'standard',
    nextDifficultyRecommendation: 'challenging'
  },
  {
    gameId: 'routine',
    score: 90,
    attempts: 1,
    mistakes: 1,
    hintsUsed: 0,
    timeSpentSeconds: 62,
    timestamp: 'Today, 11:10 AM',
    difficulty: 'standard',
    nextDifficultyRecommendation: 'standard'
  },
  {
    gameId: 'cup_shuffle',
    score: 85,
    attempts: 2,
    mistakes: 1,
    hintsUsed: 0,
    timeSpentSeconds: 35,
    timestamp: 'Yesterday, 3:30 PM',
    difficulty: 'standard',
    nextDifficultyRecommendation: 'standard'
  },
  {
    gameId: 'cultural_match',
    score: 88,
    attempts: 1,
    mistakes: 2,
    hintsUsed: 1,
    timeSpentSeconds: 92,
    timestamp: 'Yesterday, 5:00 PM',
    difficulty: 'standard',
    nextDifficultyRecommendation: 'standard'
  }
];

export const WEEKLY_ANALYTICS_DATA = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  cognitiveScores: [72, 74, 73, 76, 75, 78, 77],
  medicationAdherencePercent: [100, 100, 75, 100, 100, 100, 75],
  gamesCompletedCount: [3, 4, 2, 4, 3, 5, 2],
  minutesSpent: [22, 28, 15, 30, 25, 35, 18],
  summaryReport: {
    period: 'Current Week (Demo Data)',
    totalSessions: 23,
    medicationAdherenceRate: '93%',
    cognitiveEngagementScore: '77 / 100 (Stable / Improving)',
    highlightStrengths: ['High attention retention in visual tasks', 'Consistent morning medication schedule'],
    gentleEncouragements: ['Encourage afternoon hydration & puzzle session', 'Continue recording voice stories on weekends']
  }
};
