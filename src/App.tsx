import React, { useState, useEffect } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { InterviewProvider } from './context/InterviewContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SetupPage } from './pages/SetupPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { ResultsPage } from './pages/ResultsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { ProgressPage } from './pages/ProgressPage';

export function AppContent() {

  const getInitialRoute = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const [page, queryString] = hash.split('?');
      return { page: page || 'landing', query: queryString };
    }
    const path = window.location.pathname.replace(/^\//, '').split('/')[0];
    if (path && ['landing', 'dashboard', 'history', 'progress', 'setup', 'room', 'results', 'settings'].includes(path)) {
      return { page: path, query: window.location.search.replace('?', '') };
    }
    return { page: 'landing', query: '' };
  };

  const initial = getInitialRoute();
  const [currentPage, setCurrentPage] = useState<string>(initial.page);
  const [pageParams, setPageParams] = useState<any>(() => {
    if (initial.query) {
      const params = new URLSearchParams(initial.query);
      const parsed: Record<string, string> = {};
      params.forEach((v, k) => { parsed[k] = v; });
      return parsed;
    }
    return {};
  });

  // Sync hash with current page
  useEffect(() => {
    const handleHashChange = () => {
      const route = getInitialRoute();
      setCurrentPage(route.page);
      if (route.query) {
        const params = new URLSearchParams(route.query);
        const parsed: Record<string, string> = {};
        params.forEach((v, k) => { parsed[k] = v; });
        setPageParams(parsed);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateTo = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let hash = `#${page}`;
    if (Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString();
      hash += `?${query}`;
    }
    window.location.hash = hash;
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigateTo} />;
      case 'history':
        return <HistoryPage onNavigate={navigateTo} />;
      case 'setup':
        return <SetupPage onNavigate={navigateTo} initialType={pageParams.initialType} />;
      case 'room':
        return <InterviewRoomPage onNavigate={navigateTo} />;
      case 'results':
        return <ResultsPage onNavigate={navigateTo} sessionId={pageParams.sessionId} />;
      case 'progress':
        return <ProgressPage onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsPage onNavigate={navigateTo} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 selection:bg-brand-cyan/20 selection:text-cyan-200">
      <Navbar currentPage={currentPage} onNavigate={navigateTo} />
      <main className="flex-1 w-full flex flex-col">
        {renderCurrentPage()}
      </main>
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SettingsProvider>
          <InterviewProvider>
            <AppContent />
          </InterviewProvider>
        </SettingsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
