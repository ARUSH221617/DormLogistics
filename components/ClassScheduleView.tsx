
import React, { useState } from 'react';
import { GraduationCap, Plus, Clock, X } from 'lucide-react';
import { Member, ClassSession, DayOfWeek } from '../types';
import { DAYS, generateId } from '../utils';

interface ClassScheduleViewProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

export const ClassScheduleView: React.FC<ClassScheduleViewProps> = ({ members, setMembers }) => {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClass, setNewClass] = useState<Partial<ClassSession>>({ day: 'Mon', startTime: '09:00', endTime: '10:30', name: '' });

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const addClass = () => {
    if (!newClass.name || !newClass.startTime || !newClass.endTime || !selectedMember) return;
    const updatedMembers = members.map(m => {
      if (m.id === selectedMemberId) {
        return {
          ...m,
          classes: [...m.classes, { ...newClass, id: generateId() } as ClassSession]
        };
      }
      return m;
    });
    setMembers(updatedMembers);
    setIsAddingClass(false);
    setNewClass({ day: 'Mon', startTime: '09:00', endTime: '10:30', name: '' });
  };

  const deleteClass = (classId: string) => {
    setMembers(members.map(m => 
      m.id === selectedMemberId ? { ...m, classes: m.classes.filter(c => c.id !== classId) } : m
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
             <GraduationCap className="w-6 h-6" />
           </div>
           <select 
             value={selectedMemberId}
             onChange={(e) => setSelectedMemberId(e.target.value)}
             className="bg-transparent border-none text-lg font-bold text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
           >
             {members.map(m => <option key={m.id} value={m.id}>{m.name}'s Schedule</option>)}
           </select>
         </div>

         <button 
           onClick={() => setIsAddingClass(true)}
           className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
         >
           <Plus className="w-4 h-4" /> Add Class
         </button>
      </div>

      {/* Add Class Modal */}
      {isAddingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Class for {selectedMember?.name}</h3>
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Course Name</label>
                   <input 
                     type="text" 
                     value={newClass.name} 
                     onChange={e => setNewClass({...newClass, name: e.target.value})}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                     placeholder="e.g. Calculus II"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Day</label>
                   <select 
                     value={newClass.day} 
                     onChange={e => setNewClass({...newClass, day: e.target.value as DayOfWeek})}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                   >
                     {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Start</label>
                     <input 
                       type="time" 
                       value={newClass.startTime} 
                       onChange={e => setNewClass({...newClass, startTime: e.target.value})}
                       className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                     />
                   </div>
                   <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">End</label>
                      <input 
                        type="time" 
                        value={newClass.endTime} 
                        onChange={e => setNewClass({...newClass, endTime: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                   </div>
                 </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                 <button onClick={() => setIsAddingClass(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                 <button onClick={addClass} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Class</button>
              </div>
           </div>
        </div>
      )}

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
         {DAYS.map(day => {
            const daysClasses = selectedMember?.classes.filter(c => c.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime)) || [];
            return (
              <div key={day} className="flex flex-col gap-2">
                 <div className={`text-center py-2 rounded-lg font-semibold text-sm ${
                    daysClasses.length > 0 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                 }`}>
                    {day}
                 </div>
                 <div className="space-y-2 min-h-[100px] bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2 border border-dashed border-gray-200 dark:border-gray-700/50">
                    {daysClasses.map(cls => (
                      <div key={cls.id} className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 relative group">
                         <button 
                           onClick={() => deleteClass(cls.id)}
                           className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                         >
                           <X className="w-3 h-3" />
                         </button>
                         <p className="font-medium text-sm text-gray-900 dark:text-white truncate pr-4">{cls.name}</p>
                         <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {cls.startTime} - {cls.endTime}
                         </div>
                      </div>
                    ))}
                    {daysClasses.length === 0 && (
                      <div className="h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-xs italic">
                         Free
                      </div>
                    )}
                 </div>
              </div>
            )
         })}
      </div>
    </div>
  );
};
