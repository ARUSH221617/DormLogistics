
import React from 'react';
import { Sparkles, Utensils, Coffee, DollarSign, Plus, Zap } from 'lucide-react';
import { DaySchedule, Member, Expense, User } from '../types';
import { Card } from './Card';
import { AIAgentSection } from './AIAgentSection';

interface DashboardProps {
  schedule: DaySchedule[];
  members: Member[];
  expenses: Expense[];
  setActiveTab: (tab: any) => void;
  generateScheduleAlgo: () => void;
  generateScheduleAI: () => void;
  isGeneratingSchedule: boolean;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  currentUser: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  schedule, members, expenses, setActiveTab, 
  generateScheduleAlgo, generateScheduleAI, isGeneratingSchedule,
  setMembers, setSchedule, setExpenses, currentUser 
}) => {
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      {/* AI Agent Section */}
      <div className="mb-8">
         <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-purple-500" />
           AI Agent
         </h2>
         <AIAgentSection 
            members={members}
            setMembers={setMembers}
            setSchedule={setSchedule}
            setExpenses={setExpenses}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-6 border-l-4 border-blue-500 dark:border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Next Proxy</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {schedule.length > 0 
                  ? members.find(m => m.id === schedule[0].tasks.find(t => t.type.includes('Proxy'))?.assigneeId)?.name || 'Unassigned'
                  : 'No Schedule'}
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {schedule.length > 0 ? schedule[0].displayDate : 'Day 1'}
              </p>
            </div>
            <Utensils className="text-blue-500 w-8 h-8" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-orange-500 dark:border-orange-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Drink Duty</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {schedule.length > 0 
                  ? members.find(m => m.id === schedule[0].tasks.find(t => t.type === 'Buy Drinks')?.assigneeId)?.name || 'Unassigned'
                  : 'No Schedule'}
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tonight</p>
            </div>
            <Coffee className="text-orange-500 w-8 h-8" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-green-500 dark:border-green-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Expenses</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${expenses.reduce((acc, cur) => acc + cur.amount, 0).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This Month</p>
            </div>
            <DollarSign className="text-green-500 w-8 h-8" />
          </div>
        </Card>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setActiveTab('expenses')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <div className="hidden md:block h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 self-center"></div>
          
          {isAdmin && (
            <>
              <button 
                onClick={() => {
                  generateScheduleAlgo();
                  setActiveTab('schedule');
                }}
                disabled={isGeneratingSchedule}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                <Zap className="w-4 h-4" /> Quick Generate
              </button>
              <button 
                onClick={() => {
                  generateScheduleAI();
                  setActiveTab('schedule');
                }}
                disabled={isGeneratingSchedule}
                className="flex-1 md:flex-none w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-md text-white rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {isGeneratingSchedule ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Enhance (14d)
              </button>
            </>
          )}
          
          {!isAdmin && (
             <span className="text-sm text-gray-400 self-center italic ml-2">Schedule generation is restricted to administrators.</span>
          )}
        </div>
      </div>
    </div>
  );
};
