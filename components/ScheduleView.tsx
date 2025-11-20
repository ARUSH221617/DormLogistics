import React, { useState } from 'react';
import { Filter, X, Calendar, Utensils, Moon, Coffee, ChefHat, CheckCircle2, Circle, Zap, Sparkles, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { DaySchedule, Member, DayOfWeek, User, Recipe } from '../types';
import { DAYS } from '../utils';
import { Card } from './Card';

interface ScheduleViewProps {
  schedule: DaySchedule[];
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule[]>>;
  members: Member[];
  onGenerate: () => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  currentUser: User;
  weekendMenus: Record<string, Recipe>;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ 
  schedule, setSchedule, members, onGenerate, onGenerateAI, isGenerating, currentUser, weekendMenus 
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'All'>('All');
  const [filterTaskType, setFilterTaskType] = useState<string>('All');
  const [filterAssignee, setFilterAssignee] = useState<string>('All');

  const isAdmin = currentUser.role === 'admin';

  const taskTypes = ['Proxy Lunch', 'Proxy Dinner', 'Buy Drinks', 'Weekend Prep'];

  const toggleTaskCompletion = (taskId: string) => {
    setSchedule(prev => prev.map(day => ({
      ...day,
      tasks: day.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    })));
  };

  // --- Filter Logic for Main Grid ---
  const filteredSchedule = schedule
    .map(day => ({
      ...day,
      tasks: day.tasks.filter(t => {
        const matchesType = filterTaskType === 'All' || t.type === filterTaskType;
        const matchesAssignee = filterAssignee === 'All' || t.assigneeId === filterAssignee;
        return matchesType && matchesAssignee;
      })
    }))
    .filter(day => {
      const matchesDay = selectedDay === 'All' || day.dayOfWeek === selectedDay;
      return matchesDay && day.tasks.length > 0;
    });

  const isFiltered = selectedDay !== 'All' || filterTaskType !== 'All' || filterAssignee !== 'All';

  // --- Logic for "My Upcoming Tasks" ---
  const myUpcomingTasks = schedule.flatMap(day => 
    day.tasks
      .filter(t => t.assigneeId === currentUser.memberId && !t.completed)
      .map(t => ({ ...t, dayDisplay: day.displayDate, dayName: day.dayOfWeek, isoDate: day.isoDate }))
  ).sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  // --- Logic for "Weekend Menus" Display ---
  // Iterate through schedule to find days with weekend prep, and check if we have a menu
  const plannedMenus = schedule.flatMap(day => 
    day.tasks
      .filter(t => t.type === 'Weekend Prep' && weekendMenus[`${day.date}-${t.assigneeId}`])
      .map(t => ({
         day: day,
         task: t,
         menu: weekendMenus[`${day.date}-${t.assigneeId}`],
         chef: members.find(m => m.id === t.assigneeId)?.name || 'Unknown'
      }))
  );

  return (
    <div className="space-y-6">
      
      {/* My Assignments & Weekend Menus Row */}
      {schedule.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* My Assignments Section */}
          <Card className="p-5 border-l-4 border-indigo-500">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                 <CheckCircle2 className="w-4 h-4" />
              </span>
              My Upcoming Tasks
            </h3>
            {myUpcomingTasks.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">You have no pending tasks!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {myUpcomingTasks.map(task => (
                   <div key={task.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className="flex flex-col items-center justify-center min-w-[3rem] px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-center">
                            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{task.dayName}</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{task.dayDisplay?.split(' ')[1]}</span>
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{task.type}</p>
                            {task.note && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.note}</p>}
                         </div>
                      </div>
                      <button 
                        onClick={() => toggleTaskCompletion(task.id)}
                        className="shrink-0 p-2 text-gray-300 hover:text-green-500 transition-colors"
                        title="Mark Complete"
                      >
                         <Circle className="w-5 h-5" />
                      </button>
                   </div>
                ))}
              </div>
            )}
          </Card>

          {/* Weekend Menus Section */}
          <Card className="p-5 border-l-4 border-purple-500">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
               <span className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <ChefHat className="w-4 h-4" />
               </span>
               Weekend Menus
             </h3>
             {plannedMenus.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                   <p className="text-gray-500 dark:text-gray-400 text-sm">No menus generated yet.</p>
                   <p className="text-xs text-gray-400 mt-1">Visit the "Weekend" tab to plan meals.</p>
                </div>
             ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                   {plannedMenus.map((item, idx) => (
                      <div key={idx} className="group relative p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-lg">
                         <div className="flex justify-between items-start">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold bg-white dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-700">
                                     {item.day.displayDate}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Chef: {item.chef}</span>
                               </div>
                               <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.menu.dishName}</h4>
                            </div>
                            <BookOpen className="w-4 h-4 text-purple-400" />
                         </div>
                         <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 italic line-clamp-2">
                            "{item.menu.reasoning}"
                         </p>
                      </div>
                   ))}
                </div>
             )}
          </Card>

        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-4">
           {/* Header and Day Filters */}
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Schedule</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
                <button
                  onClick={() => setSelectedDay('All')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedDay === 'All' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Days
                </button>
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedDay === day 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
           </div>

           {/* Advanced Filters */}
           <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 w-full sm:w-auto">
                 <Filter className="w-4 h-4" />
                 <span className="text-sm font-medium">Filter by:</span>
              </div>
              
              <div className="relative flex-1 sm:flex-none min-w-[140px]">
                <select 
                    value={filterTaskType}
                    onChange={(e) => setFilterTaskType(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                    <option value="All">All Task Types</option>
                    {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="relative flex-1 sm:flex-none min-w-[140px]">
                <select 
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                    <option value="All">All Members</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              {isFiltered && (
                 <button 
                     onClick={() => {
                         setFilterTaskType('All');
                         setFilterAssignee('All');
                         setSelectedDay('All');
                     }}
                     className="ml-auto text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-medium flex items-center gap-1"
                 >
                     <X className="w-3 h-3" /> Clear
                 </button>
              )}
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedule.map((day, i) => (
          <Card key={`${day.date}-${i}`} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50 dark:border-gray-700">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{day.displayDate}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{day.dayOfWeek}</span>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-full">Day {day.date}</span>
            </div>
            
            <div className="space-y-3">
              {day.tasks.map((task, idx) => {
                const assignee = members.find(m => m.id === task.assigneeId);
                let Icon = Utensils;
                let colorClass = "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300";
                
                if (task.type === 'Proxy Dinner') {
                  Icon = Moon;
                  colorClass = "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300";
                } else if (task.type === 'Buy Drinks') {
                  Icon = Coffee;
                  colorClass = "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300";
                } else if (task.type === 'Weekend Prep') {
                  Icon = ChefHat;
                  colorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300";
                }
                
                // Dimmed styling if completed
                if (task.completed) {
                  colorClass = "text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 grayscale";
                }

                return (
                  <div key={task.id || idx} className={`flex items-center gap-3 group transition-all duration-300 ${task.completed ? 'opacity-60' : 'opacity-100'}`}>
                     <button 
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`shrink-0 transition-all duration-300 transform ${task.completed ? 'text-green-500 dark:text-green-400 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 hover:scale-105'}`}
                    >
                      {task.completed ? <CheckCircle2 className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <div className={`p-2 rounded-lg shrink-0 transition-colors duration-300 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium uppercase tracking-wide mb-0.5 transition-colors duration-300 ${task.completed ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {task.type}
                      </p>
                      <p className={`text-sm font-semibold truncate transition-all duration-300 ${task.completed ? 'text-gray-400 dark:text-gray-600 line-through decoration-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {assignee ? assignee.name : 'Unassigned'}
                      </p>
                      {task.note && (
                        <p className={`text-xs italic mt-0.5 truncate transition-colors duration-300 ${task.completed ? 'text-gray-400 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}>
                          {task.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      
      {filteredSchedule.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">{schedule.length === 0 ? 'No schedule generated yet.' : 'No tasks match your filters.'}</p>
          
          {schedule.length === 0 && isAdmin && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <button 
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" /> Quick Generate
                </button>
                <button 
                  onClick={onGenerateAI}
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:shadow-lg rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                   {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                   AI Generate
                </button>
              </div>
          )}
          {schedule.length === 0 && !isAdmin && (
             <p className="mt-2 text-sm text-gray-400">Waiting for administrator to generate schedule.</p>
          )}

          {schedule.length > 0 && isFiltered && (
               <button 
               onClick={() => {
                   setFilterTaskType('All');
                   setFilterAssignee('All');
                   setSelectedDay('All');
               }}
               className="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
               >
               Clear Filters
               </button>
          )}
        </div>
      )}
    </div>
  );
};