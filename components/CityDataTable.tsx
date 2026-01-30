import React, { useState } from 'react';
import { City } from '../types';
import { FiEdit2, FiCheck, FiX, FiCopy } from 'react-icons/fi';
import { calculatePotentialRevenue, getGrowthRoadmap } from '../services/calculationService';
import { PENETRATION_SCENARIOS } from '../constants';
import Card from './ui/Card';

interface CityDataTableProps {
  city: City;
  onUpdate?: (field: keyof City, value: any) => void;
}

const CityDataTable: React.FC<CityDataTableProps> = ({ city, onUpdate }) => {
  const [editingField, setEditingField] = useState<keyof City | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const potentialRevenue = calculatePotentialRevenue(city);
  const growthRoadmapMedia = getGrowthRoadmap(city, PENETRATION_SCENARIOS['Média']);
  const firstYearProjection = growthRoadmapMedia[11]?.rides || 0; // 12º mês

  const handleEdit = (field: keyof City, value: any) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSave = (field: keyof City) => {
    if (onUpdate) {
      onUpdate(field, editValue);
    }
    setEditingField(null);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(String(text));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatValue = (value: any, field: keyof City): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      if (field.includes('population') || field === 'formalJobs') {
        return new Intl.NumberFormat('pt-BR').format(value);
      }
      if (field.includes('Index') || field.includes('Salary') || field.includes('Income')) {
        return field.includes('Index') 
          ? (value * 100).toFixed(1) + '%'
          : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      }
    }
    return String(value);
  };

  const dataRows = [
    // Dados Básicos
    { category: 'Dados Básicos', field: 'id', label: 'ID da Cidade', value: city.id, type: 'number' },
    { category: 'Dados Básicos', field: 'name', label: 'Nome', value: city.name, type: 'text' },
    { category: 'Dados Básicos', field: 'status', label: 'Status', value: city.status, type: 'select', options: ['PLANNING', 'EXPANSION', 'CONSOLIDATED', 'NOT_SERVED'] },
    { category: 'Dados Básicos', field: 'mesorregion', label: 'Mesorregião', value: city.mesorregion, type: 'select', options: ['NORTE', 'NORDESTE', 'SUDESTE', 'SUDOESTE', 'CENTRO_SUL'] },
    
    // Dados do IBGE (Demográficos)
    { category: 'Dados do IBGE', field: 'population', label: 'População Total', value: city.population, type: 'number', editable: true },
    { category: 'Dados do IBGE', field: 'population15to44', label: 'População 15-44 anos', value: city.population15to44, type: 'number', editable: true },
    { category: 'Dados do IBGE', field: 'averageIncome', label: 'Renda Média (R$)', value: city.averageIncome, type: 'number', editable: true },
    { category: 'Dados do IBGE', field: 'urbanizationIndex', label: 'Índice de Urbanização (%)', value: (city.urbanizationIndex * 100), type: 'number', editable: true },
    { category: 'Dados do IBGE', field: 'gentilic', label: 'Gentílico', value: city.gentilic, type: 'text', editable: true },
    { category: 'Dados do IBGE', field: 'anniversary', label: 'Aniversário da Cidade', value: city.anniversary, type: 'text', editable: true },
    { category: 'Dados do IBGE', field: 'mayor', label: 'Prefeito', value: city.mayor, type: 'text', editable: true },
    { category: 'Dados do IBGE', field: 'averageFormalSalary', label: 'Salário Formal Médio (R$)', value: city.averageFormalSalary, type: 'number', editable: true },
    { category: 'Dados do IBGE', field: 'formalJobs', label: 'Empregos Formais', value: city.formalJobs, type: 'number', editable: true },
    { category: 'Dados do IBGE', field: 'urbanizedAreaKm2', label: 'Área Urbanizada (km²)', value: city.urbanizedAreaKm2, type: 'number', editable: true },
    
    // Metas e Projeções
    { category: 'Metas e Projeções', field: 'projectedRevenue', label: 'Receita Potencial (12 meses)', value: potentialRevenue, type: 'currency', editable: false },
    { category: 'Metas e Projeções', field: 'projectedRides', label: 'Corridas Projetadas (12 meses)', value: firstYearProjection, type: 'number', editable: false },
    { category: 'Metas e Projeções', field: 'implementationStartDate', label: 'Data de Início da Implementação', value: city.implementationStartDate || '-', type: 'date', editable: true },
  ];

  const groupedData = dataRows.reduce((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {} as Record<string, typeof dataRows>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedData).map(([category, rows]) => (
        <Card key={category} className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#ffffff' }}>{category}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgb(255 255 255 / 20%)' }}>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'rgb(255 255 255 / 70%)' }}>Campo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'rgb(255 255 255 / 70%)' }}>Valor</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: 'rgb(255 255 255 / 70%)' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={`${category}-${row.field}-${idx}`}
                    className="border-b hover:bg-opacity-50 transition-colors"
                    style={{
                      borderColor: 'rgb(255 255 255 / 10%)',
                      backgroundColor: editingField === row.field ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                    }}
                  >
                    <td className="py-4 px-4 text-sm" style={{ color: 'rgb(255 255 255 / 80%)' }}>
                      <div className="font-medium">{row.label}</div>
                      <div className="text-xs" style={{ color: 'rgb(255 255 255 / 50%)' }}>
                        {row.field}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {editingField === row.field ? (
                        <div className="flex items-center gap-2">
                          {row.type === 'select' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-2 py-1 rounded text-sm bg-base-300 dark:bg-dark-200 text-base-900 dark:text-white"
                            >
                              {row.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={row.type}
                              value={editValue}
                              onChange={(e) => setEditValue(row.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                              className="px-2 py-1 rounded text-sm w-full bg-base-300 dark:bg-dark-200 text-base-900 dark:text-white"
                              autoFocus
                            />
                          )}
                        </div>
                      ) : (
                        <div className="font-mono text-sm font-bold" style={{ color: '#ffffff' }}>
                          {formatValue(row.value, row.field as keyof City)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        {editingField === row.field ? (
                          <>
                            <button
                              onClick={() => handleSave(row.field as keyof City)}
                              className="p-1 rounded hover:bg-green-500 hover:bg-opacity-20 transition-colors"
                              title="Salvar"
                            >
                              <FiCheck className="w-4 h-4" style={{ color: '#08a50e' }} />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-1 rounded hover:bg-red-500 hover:bg-opacity-20 transition-colors"
                              title="Cancelar"
                            >
                              <FiX className="w-4 h-4" style={{ color: '#ff4444' }} />
                            </button>
                          </>
                        ) : (
                          <>
                            {row.editable && (
                              <button
                                onClick={() => handleEdit(row.field as keyof City, row.value)}
                                className="p-1 rounded hover:bg-blue-500 hover:bg-opacity-20 transition-colors"
                                title="Editar"
                              >
                                <FiEdit2 className="w-4 h-4" style={{ color: '#3b82f6' }} />
                              </button>
                            )}
                            <button
                              onClick={() => handleCopy(formatValue(row.value, row.field as keyof City), row.field)}
                              className="p-1 rounded hover:bg-orange-500 hover:bg-opacity-20 transition-colors"
                              title="Copiar"
                            >
                              <FiCopy
                                className="w-4 h-4"
                                style={{ color: copiedField === row.field ? '#08a50e' : '#f59e0b' }}
                              />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CityDataTable;
