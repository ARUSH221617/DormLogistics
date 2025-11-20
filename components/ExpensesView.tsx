
import React, { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Settings, DollarSign, Plus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Expense, Member, Category, User } from '../types';
import { generateId } from '../utils';
import { Card } from './Card';
import { Badge } from './Badge';

interface ExpensesViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  members: Member[];
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  defaultCategoryId: string;
  setDefaultCategoryId: React.Dispatch<React.SetStateAction<string>>;
  currentUser: User;
}

const API_KEY = process.env.API_KEY || '';

export const ExpensesView: React.FC<ExpensesViewProps> = ({ 
  expenses, setExpenses, members, categories, setCategories, defaultCategoryId, setDefaultCategoryId, currentUser
}) => {
  const isAdmin = currentUser.role === 'admin';

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  
  // Initialize payer: Admin defaults to first member, User defaults to themselves
  const [payer, setPayer] = useState(() => {
    if (isAdmin) return members[0]?.id || '';
    return currentUser.memberId && members.find(m => m.id === currentUser.memberId) 
      ? currentUser.memberId 
      : (members[0]?.id || '');
  });

  const [isAdding, setIsAdding] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Ensure payer is correct if user changes or members load
  useEffect(() => {
    if (!isAdmin && currentUser.memberId) {
        setPayer(currentUser.memberId);
    }
  }, [currentUser, isAdmin]);

  const currentMonthDate = new Date();
  const currentMonthStr = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthPrefix = currentMonthDate.toISOString().slice(0, 7); // YYYY-MM
  
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = monthlyExpenses.reduce((acc, cur) => {
      const cat = cur.category || 'Other';
      acc[cat] = (acc[cat] || 0) + cur.amount;
      return acc;
  }, {} as Record<string, number>);

  const categorizeExpenseAI = async (description: string): Promise<string> => {
    const defaultCatName = categories.find(c => c.id === defaultCategoryId)?.name || 'Other';
    if (!API_KEY) return defaultCatName;
    
    const categoryNames = categories.map(c => c.name).join(', ');

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { 
          role: 'user', 
          parts: [{ 
            text: `Categorize the following expense description into exactly one of these categories: ${categoryNames}. Return ONLY the category name. Description: "${description}"` 
          }] 
        }
      });
      
      const text = response.text?.trim() || '';
      const match = categories.find(c => c.name.toLowerCase() === text.toLowerCase());
      
      return match ? match.name : defaultCatName;
    } catch (e) {
      console.error("Expense categorization failed", e);
      return defaultCatName;
    }
  };

  const handleAdd = async () => {
    if (!desc || !amount || !payer) return;
    
    setIsAdding(true);
    try {
      const category = await categorizeExpenseAI(desc);
      const newExpense: Expense = {
        id: Date.now().toString(),
        payerId: payer,
        description: desc,
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0],
        category: category
      };
      setExpenses([newExpense, ...expenses]);
      setDesc('');
      setAmount('');
    } catch(e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const CategorySettingsModal = () => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('gray');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    
    const availableColors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'gray', 'pink', 'indigo', 'teal'];

    const handleAddCategory = () => {
      if(!newCatName) return;
      const newId = generateId();
      setCategories([...categories, { id: newId, name: newCatName, color: newCatColor }]);
      setNewCatName('');
      setNewCatColor('gray');
    };

    const handleDeleteCategory = (id: string) => {
      if (categories.length <= 1) {
        alert("You must have at least one category.");
        return;
      }
      if (id === defaultCategoryId) {
        alert("Cannot delete the default category. Please assign a new default first.");
        return;
      }
      if (confirm('Are you sure you want to delete this category?')) {
        setCategories(categories.filter(c => c.id !== id));
      }
    };

    const startEditing = (cat: Category) => {
      setEditingId(cat.id);
      setEditName(cat.name);
      setEditColor(cat.color);
    };

    const saveEditing = () => {
      if (editingId && editName.trim()) {
        setCategories(categories.map(c => c.id === editingId ? { ...c, name: editName, color: editColor } : c));
        setEditingId(null);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2 border-b dark:border-gray-700">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Categories</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Edit categories & set default for AI.</p>
            </div>
            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto mb-4">
            {categories.map(cat => (
              <div key={cat.id} className={`p-3 rounded-lg transition-all ${editingId === cat.id ? 'bg-gray-50 dark:bg-gray-700 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'}`}>
                {editingId === cat.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Category Name"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {availableColors.map(c => (
                        <button 
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`w-6 h-6 rounded-full shrink-0 border-2 transition-all ${editColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: `var(--color-${c}-500)` }}
                        >
                          <div className={`w-full h-full rounded-full bg-${c}-500`}></div>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">Cancel</button>
                      <button onClick={saveEditing} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full bg-${cat.color}-500 shadow-sm`}></div>
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-medium text-sm">{cat.name}</span>
                        {defaultCategoryId === cat.id && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">Default for AI</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {defaultCategoryId !== cat.id ? (
                        <button 
                          onClick={() => setDefaultCategoryId(cat.id)}
                          className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors mr-1"
                          title="Set as default for AI categorization"
                        >
                          Set Default
                        </button>
                      ) : (
                        <span className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 rounded mr-1 cursor-default">
                          Default
                        </span>
                      )}
                      <button 
                        onClick={() => startEditing(cat)}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        title="Edit Category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className={`text-gray-400 p-1.5 rounded-full transition-colors ${defaultCategoryId === cat.id ? 'opacity-30 cursor-not-allowed' : 'hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                        title="Delete Category"
                        disabled={defaultCategoryId === cat.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 -mx-6 -mb-6 p-6 rounded-b-xl">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Add New Category</h4>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar">
               {availableColors.map(c => (
                 <button 
                   key={c}
                   onClick={() => setNewCatColor(c)}
                   className={`w-6 h-6 rounded-full shrink-0 border-2 transition-all ${newCatColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                   style={{ backgroundColor: `var(--color-${c}-500)` }}
                 >
                   <div className={`w-full h-full rounded-full bg-${c}-500`}></div>
                 </button>
               ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleAddCategory}
                disabled={!newCatName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isCategoryModalOpen && <CategorySettingsModal />}
      
      {/* Monthly Summary Section */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
           <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
             <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-1.5 rounded-lg">
               <DollarSign className="w-4 h-4" />
             </span>
             Spending Summary
             <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">({currentMonthStr})</span>
           </h2>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Manage Categories"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${monthlyTotal.toFixed(2)}
              </div>
           </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
           {categories.map(cat => {
             const val = categoryTotals[cat.name] || 0;
             const borderMap: Record<string, string> = {
               green: 'border-green-400',
               blue: 'border-blue-400',
               purple: 'border-purple-400',
               yellow: 'border-yellow-400',
               orange: 'border-orange-400',
               gray: 'border-gray-400',
               red: 'border-red-400',
               pink: 'border-pink-400',
               indigo: 'border-indigo-400',
               teal: 'border-teal-400',
             };
             return (
               <div key={cat.id} className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-l-4 ${borderMap[cat.color] || 'border-gray-400'} shadow-sm`}>
                 <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1 truncate">{cat.name}</p>
                 <p className="text-lg font-bold text-gray-900 dark:text-white">${val.toFixed(0)}</p>
               </div>
             )
           })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Expense</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input 
              type="text" 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="e.g. Monthly Internet"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payer</label>
            <select 
              value={payer}
              onChange={e => setPayer(e.target.value)}
              disabled={!isAdmin}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <button 
            onClick={handleAdd}
            disabled={isAdding}
            className="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAdding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden md:inline">Categorizing...</span>
                <span className="md:hidden">Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add
              </>
            )}
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No expenses recorded yet.</p>
          </div>
        ) : (
          expenses.map(expense => {
            const payerName = members.find(m => m.id === expense.payerId)?.name || 'Unknown';
            const expenseCat = categories.find(c => c.name === expense.category) || categories.find(c => c.id === defaultCategoryId) || categories[0];
            
            return (
              <Card key={expense.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 w-full">
                  <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 shrink-0 mt-1">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate max-w-full">{expense.description}</h3>
                      {expense.category && (
                        <Badge color={expenseCat.color}>
                          {expense.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Paid by <span className="font-medium text-gray-700 dark:text-gray-300">{payerName}</span> on {expense.date}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between sm:block w-full sm:w-auto sm:text-right border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-2 sm:pt-0">
                  <span className="text-lg font-bold text-gray-900 dark:text-white block">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <button 
                    onClick={() => setExpenses(expenses.filter(e => e.id !== expense.id))}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
