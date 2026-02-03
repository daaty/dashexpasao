
import React, { useContext } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import DataQuery from './pages/DataQuery';
import CityDetailsPage from './pages/CityDetailsPage';
import Comparison from './pages/Comparison';
import Roadmap from './pages/Roadmap';
// import AIAssistant from './pages/AIAssistant'; // IA desabilitada
import Planning from './pages/Planning';
import PlanningDetails from './pages/PlanningDetails';
import MarketIntelligence from './pages/MarketIntelligence';
import CityMarketAnalysis from './pages/CityMarketAnalysis';
import { DataProvider, DataContext } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import LoadingIndicator from './components/ui/LoadingIndicator';
import { SaveIndicator } from './components/ui/SaveIndicator';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register all Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

// Wrapper component to handle Loading State inside Context
const AppContent: React.FC = () => {
    const { isLoading, loadingStatus, saveCounter, backendConnected, warnings } = useContext(DataContext);

    if (isLoading) {
        return <LoadingIndicator status={loadingStatus} />;
    }

    // Se backend offline, mostrar aviso prominente
    if (!backendConnected) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-red-900/50 border border-red-500 rounded-xl p-8 max-w-lg text-center">
                    <div className="text-6xl mb-4">🔌</div>
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Backend Offline</h1>
                    <p className="text-gray-300 mb-6">
                        O sistema não conseguiu conectar ao servidor de dados.
                        Nenhum dado será exibido até que a conexão seja restabelecida.
                    </p>
                    <div className="space-y-2 text-left bg-gray-800/50 rounded-lg p-4 mb-6">
                        {warnings.map((w, i) => (
                            <p key={i} className="text-sm text-gray-400">• {w}</p>
                        ))}
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                    >
                        🔄 Tentar Reconectar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <HashRouter>
                <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/consulta" element={<DataQuery />} />
                    <Route path="/cidades/:cityId" element={<CityDetailsPage />} />
                    <Route path="/comparacao" element={<Comparison />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="/planejamento" element={<Planning />} />
                    <Route path="/planejamento/:cityId" element={<PlanningDetails />} />
                    <Route path="/inteligencia" element={<MarketIntelligence />} />
                    <Route path="/inteligencia/:cityId" element={<CityMarketAnalysis />} />
                    {/* <Route path="/assistente" element={<AIAssistant />} /> */}
                </Routes>
                </Layout>
            </HashRouter>
            <SaveIndicator trigger={saveCounter} />
        </>
    );
}


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
