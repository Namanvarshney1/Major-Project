import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
export const AppLayout = ({ children }) => {
    return (<div className="min-h-screen bg-[#fbf9f0] text-[#1b1c17]">
      <Sidebar />
      <div className="pl-72">
        <Header />
        <main className="pt-16 min-h-[calc(100vh-4rem)] p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>);
};
