
import React, { useState } from 'react';
import { User, Member } from '../types';
import { generateId } from '../utils';
import { Card } from './Card';
import { Shield, UserPlus, LogIn } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User) => void;
  onRegister: (user: User, member: Member) => void;
  users: User[];
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, users }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // For creating the Member profile
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!username || !password || !fullName) {
        setError('All fields are required');
        return;
      }
      if (users.some(u => u.username === username)) {
        setError('Username already exists');
        return;
      }

      // Create Member profile
      const newMemberId = generateId();
      const newMember: Member = {
        id: newMemberId,
        name: fullName,
        startDate: new Date().toISOString().split('T')[0],
        busyDays: [],
        proxyCounts: { lunch: 0, dinner: 0 },
        dietaryRestrictions: 'None',
        classes: []
      };

      // Create User (Admin check logic for demo purposes: if username is 'admin', make them admin)
      const newUser: User = {
        id: generateId(),
        username,
        password,
        role: username.toLowerCase() === 'admin' ? 'admin' : 'user',
        memberId: newMemberId
      };

      onRegister(newUser, newMember);
    } else {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-blue-600">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
          {isRegistering ? 'Join the dorm management system' : 'Sign in to manage chores and expenses'}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g. Ali Reza"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {isRegistering ? (
                <>
                    <UserPlus className="w-4 h-4" /> Register
                </>
            ) : (
                <>
                    <LogIn className="w-4 h-4" /> Login
                </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setFullName('');
                setUsername('');
                setPassword('');
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </Card>
    </div>
  );
};
