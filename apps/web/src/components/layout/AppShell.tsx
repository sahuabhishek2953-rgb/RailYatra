import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};
