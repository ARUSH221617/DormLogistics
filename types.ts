
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ClassSession {
  id: string;
  name: string;
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  location?: string;
}

export interface Member {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  busyDays: DayOfWeek[]; // Days when they have heavy classes/work
  proxyCounts: {
    lunch: number;
    dinner: number;
  };
  dietaryRestrictions: string; 
  classes: ClassSession[];
}

export interface HomeVisit {
  id: string;
  memberId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  payerId: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface Task {
  id: string;
  type: 'Proxy Lunch' | 'Proxy Dinner' | 'Buy Drinks' | 'Weekend Prep';
  assigneeId: string | null;
  note?: string;
  completed: boolean;
}

export interface DaySchedule {
  date: number; // 1-30
  displayDate?: string;
  isoDate: string; 
  dayOfWeek: DayOfWeek;
  tasks: Task[];
}

export interface Recipe {
  dishName: string;
  ingredients: string[];
  instructions: string[];
  reasoning: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'reminder' | 'system';
}

export interface ReminderSettings {
  enabled: boolean;
  daysBefore: number;
  time: string;
  taskTypes: string[];
  email?: string;
  emailEnabled?: boolean;
}

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password: string; // Note: In a real app, this should be hashed
  role: Role;
  memberId?: string; // Links auth user to a member profile
}