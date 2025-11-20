
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Loader2, Camera, ScanLine, Upload, FileText, GraduationCap, Utensils } from 'lucide-react';
import { Card } from './Card';
import { Member, ClassSession, DaySchedule, Expense } from '../types';
import { fileToBase64, generateId, DAYS } from '../utils';

interface AIAgentSectionProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const API_KEY = process.env.API_KEY || '';

export const AIAgentSection: React.FC<AIAgentSectionProps> = ({ members, setMembers, setSchedule, setExpenses }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedMemberForClass, setSelectedMemberForClass] = useState(members[0]?.id || '');
  const [scannedReceipt, setScannedReceipt] = useState<{amount: number, date: string, description: string} | null>(null);
  const [scannedClasses, setScannedClasses] = useState<ClassSession[] | null>(null);
  const [scannedMeals, setScannedMeals] = useState<{day: string, lunch: string, dinner: string}[] | null>(null);

  const fileInputRefReceipt = useRef<HTMLInputElement>(null);
  const fileInputRefClass = useRef<HTMLInputElement>(null);
  const fileInputRefMeal = useRef<HTMLInputElement>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !API_KEY) return;
    
    setIsProcessing('receipt');
    try {
      const base64 = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      const prompt = `
        Analyze this receipt image (potentially in Persian or English). 
        Extract the Total Amount (convert to number, ignore currency symbols), Date (ISO 8601 YYYY-MM-DD), and a brief Description (e.g., Vendor Name or 'Bank Transfer').
        If the date is in Persian (Jalali), convert it to Gregorian ISO.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING, description: "YYYY-MM-DD" },
              description: { type: Type.STRING }
            },
            required: ["amount", "date", "description"]
          }
        }
      });

      if (response.text) {
         setScannedReceipt(JSON.parse(response.text));
         setExpenses(prev => [{
            id: generateId(),
            payerId: members[0]?.id,
            description: JSON.parse(response.text).description,
            amount: JSON.parse(response.text).amount,
            date: JSON.parse(response.text).date,
            category: 'Other'
         }, ...prev]);
         alert("Receipt scanned! Added to expenses list. Please verify the details in the Expenses tab.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to scan receipt.");
    } finally {
      setIsProcessing(null);
      if (fileInputRefReceipt.current) fileInputRefReceipt.current.value = '';
    }
  };

  const handleClassUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !API_KEY) return;

     setIsProcessing('class');
     try {
       const base64 = await fileToBase64(file);
       const ai = new GoogleGenAI({ apiKey: API_KEY });

       const prompt = `
         Analyze this class schedule grid. It is likely in Persian.
         Map Persian days (Shanbeh, Yekshanbeh...) to English (Sat, Sun, Mon, Tue, Wed, Thu, Fri).
         Extract all class sessions.
         Return a JSON list.
       `;

       const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: {
           parts: [
             { inlineData: { mimeType: file.type, data: base64 } },
             { text: prompt }
           ]
         },
         config: {
           responseMimeType: 'application/json',
           responseSchema: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 name: { type: Type.STRING },
                 day: { type: Type.STRING, enum: DAYS },
                 startTime: { type: Type.STRING, description: "HH:MM 24h format" },
                 endTime: { type: Type.STRING, description: "HH:MM 24h format" }
               },
               required: ["name", "day", "startTime", "endTime"]
             }
           }
         }
       });

       if (response.text) {
          const classes = JSON.parse(response.text).map((c: any) => ({ ...c, id: generateId() }));
          setScannedClasses(classes);
       }
     } catch (err) {
       console.error(err);
       alert("Failed to scan class schedule.");
     } finally {
       setIsProcessing(null);
       if (fileInputRefClass.current) fileInputRefClass.current.value = '';
     }
  };

  const handleMealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !API_KEY) return;

    setIsProcessing('meal');
    try {
      const base64 = await fileToBase64(file);
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      const prompt = `
        Analyze this food menu grid (likely Persian).
        Extract the Lunch and Dinner plans for each day found.
        Map Persian days to English codes (Sat, Sun, Mon, Tue, Wed, Thu, Fri).
        Return a JSON list.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
           parts: [
             { inlineData: { mimeType: file.type, data: base64 } },
             { text: prompt }
           ]
        },
        config: {
           responseMimeType: 'application/json',
           responseSchema: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 day: { type: Type.STRING, enum: DAYS },
                 lunch: { type: Type.STRING },
                 dinner: { type: Type.STRING }
               },
               required: ["day", "lunch", "dinner"]
             }
           }
        }
      });

      if (response.text) {
         setScannedMeals(JSON.parse(response.text));
      }
    } catch (err) {
       console.error(err);
       alert("Failed to scan meal plan.");
     } finally {
       setIsProcessing(null);
       if (fileInputRefMeal.current) fileInputRefMeal.current.value = '';
    }
  };

  const applyScannedClasses = () => {
     if (!scannedClasses || !selectedMemberForClass) return;
     
     setMembers(prev => prev.map(m => {
        if (m.id === selectedMemberForClass) {
           return { ...m, classes: [...m.classes, ...scannedClasses] };
        }
        return m;
     }));
     setScannedClasses(null);
     alert("Classes added successfully!");
  };

  const applyScannedMeals = () => {
     if (!scannedMeals) return;
     
     setSchedule(prev => prev.map(day => {
        const mealPlan = scannedMeals.find(m => m.day === day.dayOfWeek);
        if (!mealPlan) return day;

        const newTasks = day.tasks.map(t => {
           if (t.type === 'Proxy Lunch' && mealPlan.lunch) {
              return { ...t, note: mealPlan.lunch };
           }
           if (t.type === 'Proxy Dinner' && mealPlan.dinner) {
              return { ...t, note: mealPlan.dinner };
           }
           return t;
        });

        return { ...day, tasks: newTasks };
     }));

     setScannedMeals(null);
     alert("Meal notes applied to current schedule!");
  };

  return (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Class Schedule */}
        <Card className="p-5 border-t-4 border-indigo-500 relative">
           <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Import Classes</h3>
              <GraduationCap className="w-5 h-5 text-indigo-500" />
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Upload a screenshot of a weekly class grid to auto-fill a member's schedule.</p>
           
           <div className="mb-3">
             <select 
               className="w-full text-sm p-1.5 border rounded bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white"
               value={selectedMemberForClass}
               onChange={e => setSelectedMemberForClass(e.target.value)}
             >
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
           </div>

           <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRefClass}
              onChange={handleClassUpload}
           />

           <button 
              onClick={() => fileInputRefClass.current?.click()}
              disabled={!!isProcessing}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
           >
              {isProcessing === 'class' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Scan Schedule
           </button>

           {scannedClasses && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10 p-4 flex flex-col">
                 <h4 className="font-bold text-sm mb-2">Found {scannedClasses.length} Classes</h4>
                 <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                    {scannedClasses.map((c, i) => (
                       <div key={i} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="font-bold">{c.day}</span> {c.startTime}-{c.endTime}: {c.name}
                       </div>
                    ))}
                 </div>
                 <div className="flex gap-2 mt-auto">
                    <button onClick={() => setScannedClasses(null)} className="flex-1 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
                    <button onClick={applyScannedClasses} className="flex-1 py-1 text-xs bg-indigo-600 text-white rounded">Add</button>
                 </div>
              </div>
           )}
        </Card>

        {/* Card 2: Meal Plan */}
        <Card className="p-5 border-t-4 border-orange-500 relative">
           <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Digitize Menu</h3>
              <Utensils className="w-5 h-5 text-orange-500" />
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Upload a weekly food plan image to update your schedule's lunch/dinner notes.</p>

           <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRefMeal}
              onChange={handleMealUpload}
           />

           <button 
              onClick={() => fileInputRefMeal.current?.click()}
              disabled={!!isProcessing}
              className="w-full py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
           >
              {isProcessing === 'meal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              Scan Menu
           </button>

           {scannedMeals && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10 p-4 flex flex-col">
                 <h4 className="font-bold text-sm mb-2">Found {scannedMeals.length} Days</h4>
                 <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                    {scannedMeals.map((m, i) => (
                       <div key={i} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="font-bold mb-1">{m.day}</div>
                          {m.lunch && <div className="truncate">L: {m.lunch}</div>}
                          {m.dinner && <div className="truncate">D: {m.dinner}</div>}
                       </div>
                    ))}
                 </div>
                 <div className="flex gap-2 mt-auto">
                    <button onClick={() => setScannedMeals(null)} className="flex-1 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
                    <button onClick={applyScannedMeals} className="flex-1 py-1 text-xs bg-orange-600 text-white rounded">Apply</button>
                 </div>
              </div>
           )}
        </Card>

        {/* Card 3: Receipt */}
        <Card className="p-5 border-t-4 border-green-500">
           <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Scan Receipt</h3>
              <FileText className="w-5 h-5 text-green-500" />
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Upload a receipt image to automatically extract amount, date, and details.</p>

           <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRefReceipt}
              onChange={handleReceiptUpload}
           />

           <button 
              onClick={() => fileInputRefReceipt.current?.click()}
              disabled={!!isProcessing}
              className="w-full py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
           >
              {isProcessing === 'receipt' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload & Add
           </button>
        </Card>
     </div>
  );
};
