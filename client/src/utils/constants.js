// Design tokens — mirrors tailwind.config.js for use in JS contexts
export const COLORS = {
  ivory:   '#F7F5EF',
  forest:  '#183D32',
  charcoal:'#252923',
  gold:    '#C4A66A',
  sage:    '#E5EBE3',
  muted:   '#85877F',
  white:   '#FFFFFF',
};

export const ROLES = {
  ADMIN:    'admin',
  TEACHER:  'teacher',
  GUARDIAN: 'guardian',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT:  'absent',
  LATE:    'late',
  EXCUSED: 'excused',
};

export const GRADE_CONFIG = [
  { min: 90, max: 100, grade: 'A+', remark: 'Outstanding' },
  { min: 80, max: 89,  grade: 'A',  remark: 'Excellent'   },
  { min: 70, max: 79,  grade: 'B+', remark: 'Very Good'   },
  { min: 60, max: 69,  grade: 'B',  remark: 'Good'        },
  { min: 50, max: 59,  grade: 'C',  remark: 'Average'     },
  { min: 40, max: 49,  grade: 'D',  remark: 'Below Average'},
  { min: 0,  max: 39,  grade: 'F',  remark: 'Fail'        },
];

export const PAGINATION_DEFAULTS = { page: 1, limit: 10 };

export const TOKEN_KEY = 'scholara_token';
