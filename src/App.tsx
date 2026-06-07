import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/Layout/AppShell';

// Eager load components to avoid navigation lag
import Login from './components/Auth/Login';
import Onboarding from './components/Onboarding/Onboarding';
import Discovery from './components/Discovery/Discovery';
import Loader from './components/Loader/Loader';
import Dashboard from './components/Dashboard/Dashboard';
import Coach from './components/Coach/Coach';
import Leads from './components/Dashboard/Leads';
import MatchStrategy from './components/Dashboard/MatchStrategy';
import Landing from './components/Landing/Landing';

const AppContent: React.FC = () => {
  const { activeView } = useApp();

  return (
    <>
      {(() => {
        if (activeView === 'landing') {
          return <Landing />;
        }

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
    </>
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
