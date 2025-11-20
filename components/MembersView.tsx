
import React, { useState } from 'react';
import { Trash2, X, Plus, Pencil, Utensils, Moon, Coffee } from 'lucide-react';
import { Member, DaySchedule, DayOfWeek, User } from '../types';
import { DAYS } from '../utils';
import { Card } from './Card';

interface MembersViewProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  schedule: DaySchedule[];
  currentUser: User;
}

export const MembersView: React.FC<MembersViewProps> = ({ members, setMembers, schedule, currentUser }) => {
  const [newName, setNewName] = useState('');
  const [newRestriction, setNewRestriction] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  // Permission checks
  const canAddMember = isAdmin;
  const canDeleteMember = isAdmin;
  const canEditMember = (targetMemberId: string) => isAdmin || currentUser.memberId === targetMemberId;

  const addMember = () => {
    if (!newName) return;
    const newMember: Member = {
      id: Date.now().toString(),
      name: newName,
      startDate: newStartDate,
      busyDays: [],
      proxyCounts: { lunch: 0, dinner: 0 },
      dietaryRestrictions: newRestriction || 'None',
      classes: []
    };
    setMembers([...members, newMember]);
    setNewName('');
    setNewRestriction('');
    setNewStartDate(new Date().toISOString().split('T')[0]);
    setIsAddingMember(false);
  };

  const toggleBusyDay = (memberId: string, day: DayOfWeek) => {
    if (!canEditMember(memberId)) return;
    setMembers(members.map(m => {
      if (m.id !== memberId) return m;
      const isBusy = m.busyDays.includes(day);
      return {
        ...m,
        busyDays: isBusy ? m.busyDays.filter(d => d !== day) : [...m.busyDays, day]
      };
    }));
  };

  const confirmDelete = () => {
    if (memberToDelete && canDeleteMember) {
      setMembers(members.filter(m => m.id !== memberToDelete));
      setMemberToDelete(null);
    }
  };

  const saveMemberEdit = () => {
    if (editingMember) {
      setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
      setEditingMember(null);
    }
  };

  const getMemberStats = (memberId: string) => {
    const lunch = schedule.filter(d => d.tasks.some(t => t.type === 'Proxy Lunch' && t.assigneeId === memberId)).length;
    const dinner = schedule.filter(d => d.tasks.some(t => t.type === 'Proxy Dinner' && t.assigneeId === memberId)).length;
    const drinks = schedule.filter(d => d.tasks.some(t => t.type === 'Buy Drinks' && t.assigneeId === memberId)).length;
    return { lunch, dinner, drinks };
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700 transform scale-100 transition-transform">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Remove Member?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">{members.find(m => m.id === memberToDelete)?.name}</span>? 
              <br/>
              <span className="text-xs text-gray-400 mt-2 block">This action cannot be undone and will remove them from future schedules.</span>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors shadow-sm text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Member</h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!isAdmin} // Only admin can change names to prevent confusion
                />
                {!isAdmin && <p className="text-[10px] text-gray-400 mt-1">Contact admin to change name.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date (Registration)</label>
                <input 
                  type="date" 
                  value={editingMember.startDate}
                  onChange={(e) => setEditingMember({...editingMember, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dietary Restrictions</label>
                <input 
                  type="text" 
                  value={editingMember.dietaryRestrictions}
                  onChange={(e) => setEditingMember({...editingMember, dietaryRestrictions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={saveMemberEdit}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-sm text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal - Only for Admin */}
      {isAddingMember && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Member</h3>
              <button onClick={() => setIsAddingMember(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dietary Restrictions</label>
                <input 
                  type="text" 
                  value={newRestriction}
                  onChange={(e) => setNewRestriction(e.target.value)}
                  placeholder="e.g. Vegan"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsAddingMember(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={addMember}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-sm text-sm"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dorm Members</h2>
            {!isAdmin && <p className="text-xs text-gray-500 mt-1">You can only edit your own profile.</p>}
          </div>
          {canAddMember && (
            <button 
                onClick={() => setIsAddingMember(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Member</span>
                <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {members.map(member => {
            const stats = getMemberStats(member.id);
            const isOwnProfile = currentUser.memberId === member.id;
            const canEditThis = canEditMember(member.id);

            return (
              <div key={member.id} className={`p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/30 transition-all ${isOwnProfile ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-100 dark:ring-blue-900/30' : 'border-gray-100 dark:border-gray-700'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold shrink-0">
                      {member.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                        {member.name}
                        {isOwnProfile && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">You</span>}
                      </h3>
                      <div className="flex flex-col gap-0.5 mt-1">
                         <span className="text-xs text-gray-500 dark:text-gray-400 truncate">Start: {member.startDate}</span>
                         <span className="text-xs text-gray-400 dark:text-gray-500 italic truncate">{member.dietaryRestrictions !== 'None' ? member.dietaryRestrictions : 'No restrictions'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {canEditThis && (
                        <button 
                        onClick={() => setEditingMember({...member})}
                        className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                        title="Edit Member"
                        >
                        <Pencil className="w-4 h-4" />
                        </button>
                    )}
                    {canDeleteMember && (
                        <button 
                        onClick={() => setMemberToDelete(member.id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        title="Remove Member"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleBusyDay(member.id, day)}
                      disabled={!canEditThis}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        member.busyDays.includes(day)
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 font-medium'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                      } ${canEditThis ? 'hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer' : 'cursor-default opacity-80'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Current Schedule Stats */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2 text-center">
                   <div className="flex flex-col items-center justify-center p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                     <Utensils className="w-3 h-3 text-blue-500 dark:text-blue-400 mb-0.5" />
                     <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Lunch</span>
                     <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{stats.lunch}</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                     <Moon className="w-3 h-3 text-indigo-500 dark:text-indigo-400 mb-0.5" />
                     <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Dinner</span>
                     <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{stats.dinner}</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                     <Coffee className="w-3 h-3 text-orange-500 dark:text-orange-400 mb-0.5" />
                     <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Drinks</span>
                     <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{stats.drinks}</span>
                   </div>
                </div>

              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
