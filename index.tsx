import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Users, Calendar, DollarSign, ChefHat, Zap, Settings, Bell, GraduationCap, Home, Moon, Sun, X, LogOut
} from 'lucide-react';

import { 
  Member, DaySchedule, Expense, Category, Recipe, AppNotification, ReminderSettings, HomeVisit, Task, User
} from './types';
import { DAYS, parseDate, generateId } from './utils';

import { Dashboard } from './components/Dashboard';
import { MembersView } from './components/MembersView';
import { ScheduleView } from './components/ScheduleView';
import { ExpensesView } from './components/ExpensesView';
import { WeekendView } from './components/WeekendView';
import { ClassScheduleView } from './components/ClassScheduleView';
import { GoHomeScheduleView } from './components/GoHomeScheduleView';
import { ReminderSettingsView } from './components/ReminderSettingsView';
import { AuthView } from './components/AuthView';

const API_KEY = process.env.API_KEY || '';

const App = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Pre-seed a default admin for demonstration
  const [users, setUsers] = useState<User[]>([
    { id: 'admin', username: 'admin', password: 'password', role: 'admin', memberId: '1' }
  ]);

  // --- App State ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'schedule' | 'expenses' | 'weekend' | 'classes' | 'gohome'>('dashboard');
  
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Ali', startDate: '2023-10-01', busyDays: ['Mon', 'Wed'], proxyCounts: { lunch: 0, dinner: 0 }, dietaryRestrictions: 'None', classes: [] },
    { id: '2', name: 'Reza', startDate: '2023-10-01', busyDays: ['Tue', 'Thu'], proxyCounts: { lunch: 0, dinner: 0 }, dietaryRestrictions: 'Vegetarian', classes: [] },
    { id: '3', name: 'Sara', startDate: '2023-10-01', busyDays: ['Fri'], proxyCounts: { lunch: 0, dinner: 0 }, dietaryRestrictions: 'Lactose Intolerant', classes: [] },
    { id: '4', name: 'Nima', startDate: '2023-10-01', busyDays: ['Mon', 'Tue'], proxyCounts: { lunch: 0, dinner: 0 }, dietaryRestrictions: 'None', classes: [] },
  ]);
  const [homeVisits, setHomeVisits] = useState<HomeVisit[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Food', color: 'green' },
    { id: '2', name: 'Utilities', color: 'blue' },
    { id: '3', name: 'Entertainment', color: 'purple' },
    { id: '4', name: 'Transport', color: 'yellow' },
    { id: '5', name: 'Household', color: 'orange' },
    { id: '6', name: 'Other', color: 'gray' }
  ]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('6');

  const [scheduleStartDate, setScheduleStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weekendMenus, setWeekendMenus] = useState<Record<string, Recipe>>({});
  
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    daysBefore: 0,
    time: "09:00",
    taskTypes: ['Proxy Lunch', 'Proxy Dinner', 'Weekend Prep'],
    email: '',
    emailEnabled: false
  });
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // --- Effect for Dark Mode ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Effect for Click Outside Notification Dropdown ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Auth Logic ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleRegister = (user: User, member: Member) => {
    setUsers([...users, user]);
    setMembers([...members, member]);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- Logic: Scheduler Algorithm ---
  const isMemberAway = (memberId: string, dateObj: Date) => {
    return homeVisits.some(visit => {
      const start = parseDate(visit.startDate);
      const end = parseDate(visit.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const d = new Date(dateObj);
      d.setHours(12,0,0,0);
      return visit.memberId === memberId && d >= start && d <= end;
    });
  };

  const createBaselineSchedule = (
    currentMembers: Member[], 
    startDateStr: string, 
    daysToGenerate: number
  ): DaySchedule[] => {
    if (currentMembers.length === 0) return [];

    const tempMembers = currentMembers.map(m => ({
      ...m,
      proxyCounts: { lunch: 0, dinner: 0 }
    }));

    const newSchedule: DaySchedule[] = [];
    let drinkRotatorIndex = 0;
    let thuPrepRotatorIndex = 0;
    let friPrepRotatorIndex = 0;

    const startDateObj = parseDate(startDateStr);

    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + i);
      
      const jsDay = currentDate.getDay();
      const dayIndex = (jsDay + 6) % 7; 
      const dayName = DAYS[dayIndex];
      const displayDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoDate = currentDate.toISOString().split('T')[0];

      const activeMembers = tempMembers.filter(m => 
        parseDate(m.startDate) <= currentDate && !isMemberAway(m.id, currentDate)
      );

      const tasks: Task[] = [];
      
      if (activeMembers.length === 0) {
        newSchedule.push({
          date: i + 1,
          displayDate,
          isoDate,
          dayOfWeek: dayName,
          tasks: [{ id: generateId(), type: 'Proxy Lunch', assigneeId: null, note: 'No members available', completed: false }]
        });
        continue;
      }

      const findBestCandidate = (type: 'lunch' | 'dinner') => {
        const available = activeMembers.filter(m => !m.busyDays.includes(dayName));
        if (available.length === 0) return null;
        available.sort((a, b) => a.proxyCounts[type] - b.proxyCounts[type]);
        return available[0];
      };

      // 1. Lunch Proxy
      const lunchAssignee = findBestCandidate('lunch');
      if (lunchAssignee) {
        lunchAssignee.proxyCounts.lunch++;
        tasks.push({ 
          id: generateId(),
          type: 'Proxy Lunch', 
          assigneeId: lunchAssignee.id,
          note: lunchAssignee.proxyCounts.lunch > 8 ? 'Over limit (fallback)' : undefined,
          completed: false
        });
      } else {
        tasks.push({ id: generateId(), type: 'Proxy Lunch', assigneeId: null, note: 'All active members busy', completed: false });
      }

      // 2. Dinner Proxy
      const dinnerAssignee = findBestCandidate('dinner');
      if (dinnerAssignee) {
        dinnerAssignee.proxyCounts.dinner++;
        tasks.push({ 
          id: generateId(),
          type: 'Proxy Dinner', 
          assigneeId: dinnerAssignee.id,
          note: dinnerAssignee.proxyCounts.dinner > 8 ? 'Over limit (fallback)' : undefined,
          completed: false
        });
      } else {
        tasks.push({ id: generateId(), type: 'Proxy Dinner', assigneeId: null, note: 'All active members busy', completed: false });
      }

      // 3. Soft Drinks
      if (activeMembers.length > 0) {
        const drinkAssignee = activeMembers[drinkRotatorIndex % activeMembers.length];
        tasks.push({ id: generateId(), type: 'Buy Drinks', assigneeId: drinkAssignee.id, completed: false });
        drinkRotatorIndex++;
      }

      // 4. Weekend Prep
      if (dayName === 'Thu' && activeMembers.length > 0) {
        const weekendAssignee = activeMembers[thuPrepRotatorIndex % activeMembers.length];
        tasks.push({ 
          id: generateId(),
          type: 'Weekend Prep', 
          assigneeId: weekendAssignee.id, 
          note: 'Thu Dinner Prep',
          completed: false
        });
        thuPrepRotatorIndex++;
      } else if (dayName === 'Fri' && activeMembers.length > 0) {
        const weekendAssignee = activeMembers[friPrepRotatorIndex % activeMembers.length];
        tasks.push({ 
          id: generateId(),
          type: 'Weekend Prep', 
          assigneeId: weekendAssignee.id, 
          note: 'Fri All-Day Prep',
          completed: false
        });
        friPrepRotatorIndex++;
      }

      newSchedule.push({
        date: i + 1,
        displayDate,
        isoDate,
        dayOfWeek: dayName,
        tasks
      });
    }
    return newSchedule;
  };

  const generateScheduleAlgo = () => {
    const sched = createBaselineSchedule(members, scheduleStartDate, 30);
    setSchedule(sched);
  };

  const generateScheduleAI = async () => {
    if (!API_KEY) {
      alert("Please configure your API_KEY.");
      return;
    }
    
    if (members.length === 0) {
      alert("Add members first.");
      return;
    }

    setIsGeneratingSchedule(true);
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const baselineSchedule = createBaselineSchedule(members, scheduleStartDate, 14);
      const membersData = JSON.stringify(members.map(m => ({
        id: m.id,
        name: m.name,
        busyDays: m.busyDays
      })));

      const prompt = `
        I have a draft dorm chore schedule for 14 days. I need you to review and ENHANCE it.
        Draft Schedule (JSON): ${JSON.stringify(baselineSchedule)}
        Members Constraints: ${membersData}
        Your Task:
        1. **Validation**: Ensure no one is assigned a 'Proxy Lunch' or 'Proxy Dinner' on their 'busyDays'.
        2. **Enhancement**: Add a short, fun, creative "vibe" or "theme" note to tasks.
        3. **Format**: Return the full modified schedule as a JSON array using the exact same schema.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { role: 'user', parts: [{ text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.NUMBER },
                displayDate: { type: Type.STRING },
                isoDate: { type: Type.STRING },
                dayOfWeek: { type: Type.STRING },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      assigneeId: { type: Type.STRING, nullable: true },
                      note: { type: Type.STRING, nullable: true }
                    },
                    required: ["type", "assigneeId"]
                  }
                }
              },
              required: ["date", "dayOfWeek", "tasks"]
            }
          }
        }
      });

      if (response.text) {
        const aiRawSchedule = JSON.parse(response.text);
        const startDateObj = parseDate(scheduleStartDate);
        const processedSchedule = aiRawSchedule.map((day: any, index: number) => {
          const currentDate = new Date(startDateObj);
          currentDate.setDate(startDateObj.getDate() + (day.date - 1));
          const isoDate = currentDate.toISOString().split('T')[0];

          return {
            ...day,
            isoDate,
            tasks: day.tasks.map((task: any) => ({
              ...task,
              id: task.id || generateId(),
              completed: !!task.completed
            }))
          };
        });
        setSchedule(processedSchedule);
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("AI Enhancement failed. Falling back to basic schedule.");
      setSchedule(createBaselineSchedule(members, scheduleStartDate, 14));
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  // --- Logic: Notifications ---
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const sendBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const checkReminders = () => {
    if (!reminderSettings.enabled || schedule.length === 0) return;
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + reminderSettings.daysBefore);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const upcomingDays = schedule.filter(day => day.isoDate === targetDateStr);

    upcomingDays.forEach(day => {
      day.tasks.forEach(task => {
        if (
          reminderSettings.taskTypes.includes(task.type) && 
          task.assigneeId && 
          !task.completed &&
          !notifiedTasksRef.current.has(task.id)
        ) {
          const assignee = members.find(m => m.id === task.assigneeId);
          const assigneeName = assignee ? assignee.name : 'Someone';
          const title = `Upcoming: ${task.type}`;
          const message = `${assigneeName} has ${task.type} on ${day.displayDate} (${day.dayOfWeek}).`;
          
          const newNotification: AppNotification = {
            id: generateId(),
            title,
            message,
            timestamp: Date.now(),
            read: false,
            type: 'reminder'
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          notifiedTasksRef.current.add(task.id);
          sendBrowserNotification(title, message);

          // Email Notification Logic (Simulated)
          if (reminderSettings.emailEnabled && reminderSettings.email) {
            console.log(`[EMAIL SENT] To: ${reminderSettings.email}\nSubject: ${title}\nBody: ${message}`);
            // In a real application, you would trigger an API call to your backend email service here
          }
        }
      });
    });
  };

  useEffect(() => {
    checkReminders();
    const interval = setInterval(() => {
      checkReminders();
    }, 60000);
    return () => clearInterval(interval);
  }, [schedule, reminderSettings]);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Zap },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'gohome', label: 'Go Home', icon: Home },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'weekend', label: 'Weekend', icon: ChefHat },
  ];

  // If not authenticated, show AuthView
  if (!currentUser) {
    return <AuthView onLogin={handleLogin} onRegister={handleRegister} users={users} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-24 md:pb-8 transition-colors duration-300">
      {isReminderSettingsOpen && (
        <ReminderSettingsView 
          settings={reminderSettings} 
          setSettings={setReminderSettings} 
          onClose={() => setIsReminderSettingsOpen(false)} 
          onRequestPermission={requestNotificationPermission}
        />
      )}
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8 relative">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">DormLogistics</h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
                Hello, <span className="font-semibold text-gray-700 dark:text-gray-200">{currentUser.username}</span> 
                {currentUser.role === 'admin' && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Admin</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Desktop Navigation */}
             <div className="hidden md:flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
             </div>

             {/* Notifications Toggle */}
             <div className="relative" ref={notificationDropdownRef}>
               <button
                 onClick={() => {
                   setIsNotificationOpen(!isNotificationOpen);
                   if (!isNotificationOpen && unreadCount > 0) {
                      markAllNotificationsRead();
                   }
                 }}
                 className="relative p-2.5 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-all"
                 title="Notifications"
               >
                 <Bell className="w-5 h-5" />
                 {unreadCount > 0 && (
                   <span className="absolute top-0 right-0 transform translate-x-[2px] -translate-y-[2px] bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-800">
                     {unreadCount}
                   </span>
                 )}
               </button>
               
               {/* Notification Dropdown */}
               {isNotificationOpen && (
                 <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                   <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                     <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setIsReminderSettingsOpen(true);
                            setIsNotificationOpen(false);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" /> Configure
                        </button>
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => setNotifications([])}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Clear all
                          </button>
                        )}
                     </div>
                   </div>
                   
                   <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
                     {notifications.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-8 text-center">
                         <Bell className="w-12 h-12 text-gray-200 dark:text-gray-600 mb-3" />
                         <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet.</p>
                         {!reminderSettings.enabled && (
                           <button 
                             onClick={() => {
                               setIsReminderSettingsOpen(true);
                               setIsNotificationOpen(false);
                             }}
                             className="mt-2 text-xs text-blue-600 font-medium"
                           >
                             Enable Reminders
                           </button>
                         )}
                       </div>
                     ) : (
                       notifications.map(n => (
                         <div key={n.id} className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative">
                            <div className="flex justify-between items-start gap-3">
                               <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                               <div className="flex-1 min-w-0">
                                 <h4 className={`text-sm font-semibold mb-0.5 ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{n.title}</h4>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                                 <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                                    {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </p>
                               </div>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   dismissNotification(n.id);
                                 }}
                                 className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>

             {/* Dark Mode Toggle */}
             <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-all"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-white dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm border border-gray-200 dark:border-gray-700 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in duration-300 slide-in-from-bottom-4">
          {activeTab === 'dashboard' && (
            <Dashboard 
              schedule={schedule} 
              members={members} 
              expenses={expenses} 
              setActiveTab={setActiveTab}
              generateScheduleAlgo={generateScheduleAlgo}
              generateScheduleAI={generateScheduleAI}
              isGeneratingSchedule={isGeneratingSchedule}
              setMembers={setMembers}
              setSchedule={setSchedule}
              setExpenses={setExpenses}
              currentUser={currentUser}
            />
          )}
          {activeTab === 'members' && (
            <MembersView 
              members={members} 
              setMembers={setMembers} 
              schedule={schedule}
              currentUser={currentUser} 
            />
          )}
          {activeTab === 'schedule' && (
            <ScheduleView 
              schedule={schedule} 
              setSchedule={setSchedule} 
              members={members} 
              onGenerate={generateScheduleAlgo}
              onGenerateAI={generateScheduleAI}
              isGenerating={isGeneratingSchedule}
              currentUser={currentUser} 
              weekendMenus={weekendMenus}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesView 
              expenses={expenses} 
              setExpenses={setExpenses} 
              members={members}
              categories={categories}
              setCategories={setCategories}
              defaultCategoryId={defaultCategoryId}
              setDefaultCategoryId={setDefaultCategoryId}
              currentUser={currentUser}
            />
          )}
          {activeTab === 'weekend' && (
            <WeekendView 
              schedule={schedule} 
              members={members} 
              weekendMenus={weekendMenus} 
              setWeekendMenus={setWeekendMenus} 
            />
          )}
          {activeTab === 'classes' && (
            <ClassScheduleView 
              members={members} 
              setMembers={setMembers} 
            />
          )}
          {activeTab === 'gohome' && (
            <GoHomeScheduleView 
              members={members} 
              homeVisits={homeVisits} 
              setHomeVisits={setHomeVisits} 
              currentUser={currentUser}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 pb-safe pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 overflow-x-auto no-scrollbar">
        <div className="flex justify-between items-center pb-2 min-w-max gap-2 px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 transition-colors ${
                activeTab === tab.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium truncate w-full text-center">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);