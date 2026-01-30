import React, { useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import CityDetails from '../components/CityDetails';
import CityDataTable from '../components/CityDataTable';
import Card from '../components/ui/Card';
import { FiArrowLeft } from 'react-icons/fi';

const CityDetailsPage: React.FC = () => {
    const { cityId } = useParams<{ cityId: string }>();
    const navigate = useNavigate();
    const { cities, updateCity } = useContext(DataContext);

    const city = useMemo(() => {
        return cities.find(c => c.id === Number(cityId));
    }, [cities, cityId]);

    const handleUpdateCity = (field: string, value: any) => {
        if (city) {
            updateCity(city.id, { ...city, [field]: value });
        }
    };

    if (!city) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>Cidade não encontrada</h2>
                <button 
                    onClick={() => navigate('/consulta')}
                    className="mt-4 px-4 py-2 text-white rounded-lg transition"
                    style={{ backgroundColor: '#3b82f6' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                    Voltar para Consulta
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 rounded-full transition"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Voltar"
                >
                    <FiArrowLeft className="h-6 w-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                </button>
                <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                    Detalhes de {city.name}
                </h1>
            </div>

            <Card className="backdrop-blur-sm" style={{ background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(10px)' }}>
                <CityDetails city={city} />
            </Card>

            {/* Tabela de Configurações Consolidada */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#ffffff' }}>
                    📊 Configurações de Dados
                </h2>
                <CityDataTable city={city} onUpdate={handleUpdateCity} />
            </div>
        </div>
    );
};

export default CityDetailsPage;
