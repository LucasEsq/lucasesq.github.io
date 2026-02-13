// Application constants
const CONSTANTS = {
  // Default values
  DEFAULT_DIFFICULTY: 3,
  DEFAULT_CATEGORY_COLOR: '#8b5a3c',
  
  // Time periods for stats
  TIME_PERIODS: [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' }
  ],

  HABIT_DOT_WINDOW_DAYS: 7,
  
  // Page names for navigation
  PAGES: {
    CATEGORIES: 'categories',
    HABITS: 'habits',
    TODOS: 'todos',
    CALENDAR: 'calendar',
    STATS: 'stats'
  },
  
  // Item types for completion tracking
  ITEM_TYPES: {
    HABIT: 'habit',
    TODO: 'todo'
  },
  
  // Encryption settings
  ENCRYPTION: {
    ITERATIONS: 100000,
    SALT_LENGTH: 16,
    IV_LENGTH: 12,
    ALGORITHM: 'AES-GCM',
    KEY_LENGTH: 256
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    THEME: 'theme',
    LAST_PAGE: 'last_page'
  },
  
  // Calendar configuration
  CALENDAR: {
    DAYS_IN_WEEK: 7,
    WEEKS_IN_CALENDAR: 6,
    DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    MONTH_NAMES: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  },
  
  // Colors for default categories
  DEFAULT_CATEGORY_COLORS: [
    '#8b5a3c', // Brown
    '#4a7c59', // Green
    '#3a506b', // Blue
    '#8a4f7d', // Purple
    '#c44d56', // Red
    '#e6af2e', // Yellow
    '#4ecdc4', // Teal
    '#ff6b6b'  // Coral
  ]
};

// Export if using modules, or assign to window for global access
if (typeof window !== 'undefined') {
  window.CONSTANTS = CONSTANTS;
}