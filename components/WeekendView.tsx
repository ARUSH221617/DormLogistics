
import React, { useState } from 'react';
import { ChefHat, ShoppingBag, BookOpen, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DaySchedule, Member, Recipe } from '../types';
import { Card } from './Card';

interface WeekendViewProps {
  schedule: DaySchedule[];
  members: Member[];
  weekendMenus: Record<string, Recipe>;
  setWeekendMenus: React.Dispatch<React.SetStateAction<Record<string, Recipe>>>;
}

const API_KEY = process.env.API_KEY || '';

export const WeekendView: React.FC<WeekendViewProps> = ({ schedule, members, weekendMenus, setWeekendMenus }) => {
  const [loadingMenuId, setLoadingMenuId] = useState<string | null>(null);
  
  const weekendTasks = schedule.filter(d => d.tasks.some(t => t.type === 'Weekend Prep'));

  const generateMenuWithAI = async (id: string, chefName: string, taskNote: string) => {
    if (!API_KEY) return;
    setLoadingMenuId(id);
    
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      // Collect user preferences
      const userContext = members.map(m => 
        `- ${m.name}: ${m.dietaryRestrictions || 'No restrictions'}`
      ).join('\n');

      const prompt = `
        Generate a specific, easy-to-make meal plan for a student dorm.
        
        Context:
        - Chef: ${chefName}
        - Occasion: ${taskNote}
        - Budget: Low (Student friendly)
        
        Eaters & Restrictions:
        ${userContext}
        
        Ensure the meal respects ALL dietary restrictions listed above.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { role: 'user', parts: [{ text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dishName: { type: Type.STRING, description: "Name of the dish" },
              ingredients: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of main ingredients needed"
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Short step-by-step preparation instructions (max 3-4 steps)"
              },
              reasoning: {
                type: Type.STRING,
                description: "Why this dish fits the group constraints"
              }
            },
            required: ["dishName", "ingredients", "instructions", "reasoning"]
          }
        }
      });

      if (response.text) {
        const recipe: Recipe = JSON.parse(response.text);
        setWeekendMenus(prev => ({ ...prev, [id]: recipe }));
      }
    } catch (e) {
      console.error("Error generating menu:", e);
      alert("Failed to generate menu. Please check your API Key.");
    } finally {
      setLoadingMenuId(null);
    }
  };

  return (
    <div className="space-y-6">
      {weekendTasks.length === 0 && (
         <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No weekend tasks scheduled yet.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {weekendTasks.map((day, idx) => {
          const task = day.tasks.find(t => t.type === 'Weekend Prep');
          if (!task) return null;
          
          const chef = members.find(m => m.id === task.assigneeId);
          const menuId = `${day.date}-${task.assigneeId}`;
          const menu = weekendMenus[menuId];

          return (
            <Card key={idx} className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                 <div>
                   <span className="text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded uppercase tracking-wide">
                     {day.displayDate} ({day.dayOfWeek})
                   </span>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                     {task.note || 'Weekend Feast'}
                   </h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                     Chef: <span className="font-semibold text-gray-800 dark:text-gray-200">{chef?.name}</span>
                   </p>
                 </div>
                 <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full text-purple-600 dark:text-purple-400">
                   <ChefHat className="w-6 h-6" />
                 </div>
              </div>

              {menu ? (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex-1">
                  <div className="flex justify-between items-baseline mb-3">
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">{menu.dishName}</h4>
                    <button 
                       onClick={() => setWeekendMenus(prev => {
                          const copy = {...prev};
                          delete copy[menuId];
                          return copy;
                       })}
                       className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      Regenerate
                    </button>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                       <p className="text-gray-600 dark:text-gray-300 italic text-xs leading-relaxed">"{menu.reasoning}"</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <ShoppingBag className="w-3 h-3" /> Ingredients
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {menu.ingredients.map((ing, i) => (
                          <span key={i} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 text-xs">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> Instructions
                      </h5>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {menu.instructions.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-6 text-center">
                   <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                     No menu planned yet for this event.
                   </p>
                   <button
                     onClick={() => generateMenuWithAI(menuId, chef?.name || 'Someone', task.note || 'Dinner')}
                     disabled={loadingMenuId === menuId}
                     className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                   >
                     {loadingMenuId === menuId ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <Sparkles className="w-4 h-4" />
                     )}
                     Generate AI Menu
                   </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
