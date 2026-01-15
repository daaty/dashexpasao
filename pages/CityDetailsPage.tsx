import React, { useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import CityDetails from '../components/CityDetails';
import Card from '../components/ui/Card';
import { FiArrowLeft } from 'react-icons/fi';

const CityDetailsPage: React.FC = () => {
    const { cityId } = useParams<{ cityId: string }>();
    const navigate = useNavigate();
    const { cities } = useContext(DataContext);

    const city = useMemo(() => {
        return cities.find(c => c.id === Number(cityId));
    }, [cities, cityId]);

    if (!city) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Cidade não encontrada</h2>
                <button 
                    onClick={() => navigate('/consulta')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
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
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-100 transition"
                    title="Voltar"
                >
                    <FiArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalhes de {city.name}
                </h1>
            </div>

            <Card className="bg-white">
                <CityDetails city={city} />
            </Card>
        </div>
    );
};

export default CityDetailsPage;
