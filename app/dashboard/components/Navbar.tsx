import React, { useState } from 'react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  toggleSidebar: () => void;
}

export default function Navbar({ user, onLogout, toggleSidebar }: NavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-md z-50 sticky top-0">
      {/* Left Side: Logo & Mobile Menu */}
      <div className="flex items-center space-x-4">
        <button
          className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={toggleSidebar}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">ADYATAMA</span>
        </div>
      </div>

      {/* Right Side: Actions & User */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-400">{user?.role || 'Member'}</div>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm text-gray-900 font-medium">Signed in as</p>
                <p className="text-sm text-gray-500 truncate">{user?.email || user?.username}</p>
              </div>
              <a href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Your Profile
              </a>
              <a href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </a>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
