import React, { useState, useEffect, useCallback } from 'react';
import { DatiMensili } from './types';
import { apiService } from './services/api';
import { getMeseCorrente } from './utils/formatters';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import GestioneEntrate from './components/GestioneEntrate';
import GestioneSpese from './components/GestioneSpese';
import GestionePrelievi from './components/GestionePrelievi';
import RiepilogoAnnuale from './components/RiepilogoAnnuale';
import Impostazioni from './components/Impostazioni';
import YearMonthSelector from './components/YearMonthSelector';
import Onboarding from './components/Onboarding';
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Wallet,
  Calendar,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type TabType = 'dashboard' | 'entrate' | 'spese' | 'prelievi' | 'riepilogo' | 'impostazioni';

function AppContent() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [tabAttiva, setTabAttiva] = useState<TabType>('dashboard');
  const [datiMensili, setDatiMensili] = useState<DatiMensili | null>(null);
  const [meseSelezionato, setMeseSelezionato] = useState(getMeseCorrente().mese);
  const [annoSelezionato, setAnnoSelezionato] = useState(getMeseCorrente().anno);
  const [sidebarAperta, setSidebarAperta] = useState(false);
  const [sidebarCollassata, setSidebarCollassata] = useState(false);
  const [anniDisponibili, setAnniDisponibili] = useState<number[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const caricaAnniDisponibili = useCallback(async () => {
    try {
      const anni = await apiService.getAnniDisponibili();
      setAnniDisponibili(anni);
    } catch (error) {
      console.error('Errore nel caricamento anni disponibili:', error);
      // Fallback: usa l'anno corrente se non riesce a caricare
      setAnniDisponibili([annoSelezionato]);
    }
  }, [annoSelezionato]);

  const caricaDatiMensili = useCallback(async () => {
    try {
      const dati = await apiService.getDatiMensili(annoSelezionato, meseSelezionato);
      setDatiMensili(dati);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    }
  }, [annoSelezionato, meseSelezionato]);

  useEffect(() => {
    caricaDatiMensili();
  }, [caricaDatiMensili]);

  useEffect(() => {
    caricaAnniDisponibili();
  }, [caricaAnniDisponibili]);

  useEffect(() => {
    if (isAuthenticated && user && !user.onboarding_completed) {
      setShowOnboarding(true);
    } else if (isAuthenticated && user && user.onboarding_completed) {
      setShowOnboarding(false);
    }
  }, [isAuthenticated, user]);

  const tabs = [
    { id: 'dashboard', nome: 'Dashboard', icona: BarChart3 },
    { id: 'entrate', nome: 'Entrate', icona: DollarSign },
    { id: 'spese', nome: 'Uscite', icona: ShoppingCart },
    { id: 'prelievi', nome: 'Prelievi', icona: Wallet },
    { id: 'riepilogo', nome: 'Riepilogo Annuale', icona: Calendar },
  ];

  const impostazioniTab = { id: 'impostazioni', nome: 'Impostazioni', icona: Settings };

  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      logout();
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Ricarica i dati utente per aggiornare lo stato onboarding
    window.location.reload();
  };

  const handleSkipOnboarding = async () => {
    console.log('handleSkipOnboarding chiamato');
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Token per skip:', token ? 'Presente' : 'Mancante');

      const response = await fetch('http://localhost:3001/api/auth/skip-onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Accesso temporaneo consentito');
        // NON aggiorniamo onboarding_completed - rimane false
        setShowOnboarding(false);
        // Mostra notifica che può completare dalle impostazioni
        alert('Puoi completare la configurazione del profilo fiscale dalle Impostazioni quando vuoi!');
      } else {
        console.error('Errore nel salto onboarding:', responseData);
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} onSkip={handleSkipOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile - Overlay */}
      {sidebarAperta && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/80 transition-opacity"
            onClick={() => setSidebarAperta(false)}
          />

          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
            {/* Close Button */}
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                onClick={() => setSidebarAperta(false)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Chiudi sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  ForfettApp
                </h1>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul className="-mx-2 space-y-1">
                      {tabs.map((tab) => {
                        const Icona = tab.icona;
                        return (
                          <li key={tab.id}>
                            <button
                              onClick={() => {
                                setTabAttiva(tab.id as TabType);
                                setSidebarAperta(false);
                              }}
                              className={`w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${tabAttiva === tab.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                            >
                              <Icona
                                className={`h-6 w-6 shrink-0 ${tabAttiva === tab.id
                                  ? 'text-blue-600'
                                  : 'text-gray-400 group-hover:text-blue-600'
                                  }`}
                              />
                              {tab.nome}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  {/* Impostazioni - in basso */}
                  <li className="mt-auto -mx-2">
                    <button
                      onClick={() => {
                        setTabAttiva('impostazioni');
                        setSidebarAperta(false);
                      }}
                      className={`w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${tabAttiva === 'impostazioni'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                    >
                      <Settings
                        className={`h-6 w-6 shrink-0 ${tabAttiva === 'impostazioni'
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-blue-600'
                          }`}
                      />
                      {impostazioniTab.nome}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop - Static */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollassata ? 'lg:w-20' : 'lg:w-72'
        }`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-center">
            {!sidebarCollassata && (
              <h1 className="text-xl font-bold text-gray-900">
                ForfettApp
              </h1>
            )}
            {sidebarCollassata && (
              <h1 className="text-xl font-bold text-blue-600">
                FA
              </h1>
            )}
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {tabs.map((tab) => {
                    const Icona = tab.icona;
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setTabAttiva(tab.id as TabType)}
                          className={`w-full group flex ${sidebarCollassata ? 'justify-center' : 'gap-x-3'} rounded-md p-2 text-sm font-semibold leading-6 ${tabAttiva === tab.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          title={sidebarCollassata ? tab.nome : undefined}
                        >
                          <Icona
                            className={`h-6 w-6 shrink-0 ${tabAttiva === tab.id
                              ? 'text-blue-600'
                              : 'text-gray-400 group-hover:text-blue-600'
                              }`}
                          />
                          {!sidebarCollassata && (
                            <span className="whitespace-nowrap opacity-0 animate-fadeIn">
                              {tab.nome}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
              {/* Impostazioni - in basso */}
              <li className="mt-auto -mx-2">
                <button
                  onClick={() => setTabAttiva('impostazioni')}
                  className={`w-full group flex ${sidebarCollassata ? 'justify-center' : 'gap-x-3'} rounded-md p-2 text-sm font-semibold leading-6 ${tabAttiva === 'impostazioni'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  title={sidebarCollassata ? impostazioniTab.nome : undefined}
                >
                  <Settings
                    className={`h-6 w-6 shrink-0 ${tabAttiva === 'impostazioni'
                      ? 'text-blue-600'
                      : 'text-gray-400 group-hover:text-blue-600'
                      }`}
                  />
                  {!sidebarCollassata && (
                    <span className="whitespace-nowrap opacity-0 animate-fadeIn">
                      {impostazioniTab.nome}
                    </span>
                  )}
                </button>
              </li>
              {/* Bottone Collassa/Espandi */}
              <li className="-mx-2">
                <button
                  onClick={() => setSidebarCollassata(!sidebarCollassata)}
                  className={`w-full group flex ${sidebarCollassata ? 'justify-center' : 'gap-x-3'} rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 hover:bg-gray-50`}
                  title={sidebarCollassata ? 'Espandi sidebar' : 'Collassa sidebar'}
                >
                  {sidebarCollassata ? (
                    <ChevronRight className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-600" />
                  ) : (
                    <>
                      <ChevronLeft className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-blue-600" />
                      <span className="whitespace-nowrap opacity-0 animate-fadeIn">Collassa</span>
                    </>
                  )}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollassata ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Top Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarAperta(true)}
            className="lg:hidden -m-2.5 p-2.5 text-gray-700 hover:text-gray-900"
          >
            <span className="sr-only">Apri sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          {/* Year/Month Selector (al posto della search bar) + User Info */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-end">
              <YearMonthSelector
                annoSelezionato={annoSelezionato}
                meseSelezionato={meseSelezionato}
                onAnnoChange={setAnnoSelezionato}
                onMeseChange={setMeseSelezionato}
                anniDisponibili={anniDisponibili}
              />
            </div>

            {/* User Info */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-3">
                <div className="flex items-center gap-x-2 text-sm text-gray-700">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="hidden sm:inline">{user?.nome} {user?.cognome}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Esci"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {tabAttiva === 'dashboard' && (
              <Dashboard
                meseSelezionato={meseSelezionato}
                annoSelezionato={annoSelezionato}
                onDatiAggiornati={caricaDatiMensili}
              />
            )}

            {tabAttiva === 'entrate' && (
              <GestioneEntrate
                meseSelezionato={meseSelezionato}
                annoSelezionato={annoSelezionato}
                entrate={datiMensili?.entrate?.lista || []}
                percentualeTasse={datiMensili?.calcoli?.percentualeTasse || 0}
                onEntrateAggiornate={caricaDatiMensili}
              />
            )}

            {tabAttiva === 'spese' && (
              <GestioneSpese
                meseSelezionato={meseSelezionato}
                annoSelezionato={annoSelezionato}
                spese={datiMensili?.spese?.lista || []}
                onSpeseAggiornate={caricaDatiMensili}
              />
            )}

            {tabAttiva === 'prelievi' && (
              <GestionePrelievi
                meseSelezionato={meseSelezionato}
                annoSelezionato={annoSelezionato}
                prelievi={datiMensili?.prelievi?.lista || []}
                stipendioDisponibile={datiMensili?.calcoli?.stipendioDisponibile || 0}
                onPrelieviAggiornati={caricaDatiMensili}
              />
            )}

            {tabAttiva === 'riepilogo' && (
              <RiepilogoAnnuale annoSelezionato={annoSelezionato} />
            )}

            {tabAttiva === 'impostazioni' && (
              <Impostazioni />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-16">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-500">
              <p>Gestione Finanze P.IVA - Partita IVA Forfettaria - Tasse e Contributi calcolati dinamicamente</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;