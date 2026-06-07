import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/Layout/AppShell';

// Lazy load components
const Login = lazy(() => import('./components/Auth/Login'));
const Onboarding = lazy(() => import('./components/Onboarding/Onboarding'));
const Discovery = lazy(() => import('./components/Discovery/Discovery'));
const Loader = lazy(() => import('./components/Loader/Loader'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Coach = lazy(() => import('./components/Coach/Coach'));
const Leads = lazy(() => import('./components/Dashboard/Leads'));
const MatchStrategy = lazy(() => import('./components/Dashboard/MatchStrategy'));

const AppContent: React.FC = () => {
  const { activeView } = useApp();

  return (
    <Suspense fallback={null}>
      {(() => {
        if (activeView === 'login') {
          return <Login />;
        }

        if (activeView === 'onboarding') {
          return <Onboarding />;
        }

        return (
          <AppShell>
            {(() => {
              switch (activeView) {
                case 'dashboard':
                  return <Dashboard />;
                case 'discovery':
                  return <Discovery />;
                case 'loader':
                  return <Loader />;
                case 'coach':
                  return <Coach />;
                case 'leads':
                  return <Leads />;
                case 'match-strategy':
                  return <MatchStrategy />;
                case 'profile':
                  return <Onboarding />;
                default:
                  return <Dashboard />;
              }
            })()}
          </AppShell>
        );
      })()}
    </Suspense>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="page-wrapper">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
