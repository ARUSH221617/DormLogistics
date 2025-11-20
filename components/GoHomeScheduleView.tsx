
import React, { useState } from 'react';
import { Home, Plus, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { Member, HomeVisit } from '../types';
import { generateId } from '../utils';
import { Card } from './Card';

interface GoHomeScheduleViewProps {
  members: Member[];
  homeVisits: HomeVisit[];
  setHomeVisits: React.Dispatch<React.SetStateAction<HomeVisit[]>>;
}

export const GoHomeScheduleView: React.FC<GoHomeScheduleViewProps> = ({ members, homeVisits, setHomeVisits }) => {
  const [isLoggingVisit, setIsLoggingVisit] = useState(false);
  const [newVisit, setNewVisit] = useState<Partial<HomeVisit>>({ 
    memberId: members[0]?.id, 
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
    reason: 'Weekend Home' 
  });

  const addVisit = () => {
    if(!newVisit.memberId || !newVisit.startDate || !newVisit.endDate) return;
    const visit: HomeVisit = {
      ...newVisit as HomeVisit,
      id: generateId()
    };
    setHomeVisits([...homeVisits, visit]);
    setIsLoggingVisit(false);
  };

  const deleteVisit = (id: string) => {
    setHomeVisits(homeVisits.filter(h => h.id !== id));
  };

  const sortedVisits = [...homeVisits].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none">
         <div className="flex justify-between items-center">
           <div>
             <h2 className="text-2xl font-bold">Absences & Home Visits</h2>
             <p className="text-indigo-100 mt-1">Track who is away so chores aren't assigned.</p>
           </div>
           <button 
             onClick={() => setIsLoggingVisit(true)}
             className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-indigo-50 transition-colors flex items-center gap-2"
           >
             <Plus className="w-4 h-4" /> Log Visit
           </button>
         </div>
      </Card>

      {/* Add Visit Modal */}
      {isLoggingVisit && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log Home Visit</h3>
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Member</label>
                   <select 
                     value={newVisit.memberId} 
                     onChange={e => setNewVisit({...newVisit, memberId: e.target.value})}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                   >
                     {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Start Date</label>
                       <input 
                         type="date" 
                         value={newVisit.startDate} 
                         onChange={e => setNewVisit({...newVisit, startDate: e.target.value})}
                         className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">End Date</label>
                       <input 
                         type="date" 
                         value={newVisit.endDate} 
                         onChange={e => setNewVisit({...newVisit, endDate: e.target.value})}
                         className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                       />
                    </div>
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Reason (Optional)</label>
                   <input 
                     type="text" 
                     value={newVisit.reason} 
                     onChange={e => setNewVisit({...newVisit, reason: e.target.value})}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                     placeholder="e.g. Family Wedding"
                   />
                 </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                 <button onClick={() => setIsLoggingVisit(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                 <button onClick={addVisit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Log Absence</button>
              </div>
           </div>
        </div>
      )}

      <div className="space-y-3">
         {sortedVisits.length === 0 ? (
           <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <Home className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No planned absences.</p>
           </div>
         ) : (
           sortedVisits.map(visit => {
              const member = members.find(m => m.id === visit.memberId);
              const isPast = new Date(visit.endDate) < new Date();
              const isCurrent = new Date(visit.startDate) <= new Date() && new Date(visit.endDate) >= new Date();

              return (
                <Card key={visit.id} className={`p-4 flex items-center justify-between ${isPast ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                         isCurrent 
                           ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                           : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                      }`}>
                         {member?.name[0]}
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {member?.name}
                            {isCurrent && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Away Now</span>}
                         </h4>
                         <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{visit.startDate}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{visit.endDate}</span>
                         </div>
                         {visit.reason && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">"{visit.reason}"</p>}
                      </div>
                   </div>
                   <button 
                     onClick={() => deleteVisit(visit.id)}
                     className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </Card>
              );
           })
         )}
      </div>
    </div>
  );
};
