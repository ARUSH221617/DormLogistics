
import React from 'react';
import { Bell, X, Check } from 'lucide-react';
import { ReminderSettings } from '../types';

interface ReminderSettingsViewProps {
  settings: ReminderSettings;
  setSettings: React.Dispatch<React.SetStateAction<ReminderSettings>>;
  onClose: () => void;
  onRequestPermission: () => Promise<boolean>;
}

export const ReminderSettingsView: React.FC<ReminderSettingsViewProps> = ({ settings, setSettings, onClose, onRequestPermission }) => {
  return (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-in fade-in duration-200 p-4">
       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reminder Settings</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
             {/* Enable Switch */}
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Enable Notifications</span>
                <button 
                  onClick={async () => {
                    if (!settings.enabled) {
                      const granted = await onRequestPermission();
                      if (granted) {
                         setSettings(prev => ({ ...prev, enabled: true }));
                      }
                    } else {
                      setSettings(prev => ({ ...prev, enabled: false }));
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>

             {settings.enabled && (
               <div className="space-y-4 animate-in slide-in-from-top-2 fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Notify Me For</label>
                    <div className="space-y-2">
                      {['Proxy Lunch', 'Proxy Dinner', 'Weekend Prep'].map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                           <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.taskTypes.includes(type) ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-blue-400'}`}>
                              {settings.taskTypes.includes(type) && <Check className="w-3.5 h-3.5 text-white" />}
                           </div>
                           <input 
                             type="checkbox" 
                             className="hidden"
                             checked={settings.taskTypes.includes(type)}
                             onChange={() => {
                                setSettings(prev => ({
                                   ...prev,
                                   taskTypes: prev.taskTypes.includes(type) 
                                     ? prev.taskTypes.filter(t => t !== type)
                                     : [...prev.taskTypes, type]
                                }))
                             }}
                           />
                           <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timing</label>
                       <select 
                         value={settings.daysBefore}
                         onChange={e => setSettings(prev => ({ ...prev, daysBefore: parseInt(e.target.value) }))}
                         className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                       >
                          <option value={0}>Same Day</option>
                          <option value={1}>1 Day Before</option>
                          <option value={2}>2 Days Before</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">At Time</label>
                       <input 
                         type="time"
                         value={settings.time}
                         onChange={e => setSettings(prev => ({ ...prev, time: e.target.value }))}
                         className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                       />
                     </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
                     <Bell className="w-4 h-4 shrink-0 mt-0.5" />
                     <p>Notifications will appear in this app and as browser alerts if permissions are granted.</p>
                  </div>
               </div>
             )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Done
            </button>
          </div>
       </div>
     </div>
  )
};
