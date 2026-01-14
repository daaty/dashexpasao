
import React, { useContext } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import DataQuery from './pages/DataQuery';
import Comparison from './pages/Comparison';
import Roadmap from './pages/Roadmap';
// import AIAssistant from './pages/AIAssistant'; // IA desabilitada
import Planning from './pages/Planning';
import PlanningDetails from './pages/PlanningDetails';
import MarketIntelligence from './pages/MarketIntelligence';
import CityMarketAnalysis from './pages/CityMarketAnalysis';
import { DataProvider, DataContext } from './context/DataContext';
import LoadingIndicator from './components/ui/LoadingIndicator';
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
    const { isLoading, loadingStatus } = useContext(DataContext);

    if (isLoading) {
        return <LoadingIndicator status={loadingStatus} />;
    }

    return (
        <HashRouter>
            <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/consulta" element={<DataQuery />} />
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
    );
}


const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
