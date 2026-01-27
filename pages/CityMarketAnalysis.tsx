
import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import Card from '../components/ui/Card';
import { FiArrowLeft, FiSave, FiTrendingUp, FiUsers, FiTarget, FiShield, FiPlus, FiTrash2, FiEdit2, FiPhone, FiMail, FiUser, FiGlobe } from 'react-icons/fi';
import { CityMarketData, MarketCompetitor, StakeholderContact } from '../types';

const CityMarketAnalysis: React.FC = () => {
    const { cityId } = useParams<{ cityId: string }>();
    const navigate = useNavigate();
    const { cities, getCityMarketData, saveCityMarketData } = useContext(DataContext);
    const [activeTab, setActiveTab] = useState<'overview' | 'competition' | 'stakeholders' | 'swot'>('overview');

    const city = cities.find(c => c.id === Number(cityId));
    
    // Form States
    const [formData, setFormData] = useState<CityMarketData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initial Load
    useEffect(() => {
        if (cityId) {
            const data = getCityMarketData(Number(cityId));
            setFormData(data);
        }
    }, [cityId, getCityMarketData]);

    const handleSave = () => {
        if (formData) {
            setIsSaving(true);
            saveCityMarketData(formData);
            // Simulate network delay
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    // --- Competitor Handlers ---
    const addCompetitor = () => {
        if (!formData) return;
        const newComp: MarketCompetitor = {
            id: Date.now().toString(),
            name: 'Novo Concorrente',
            priceLevel: 'Médio',
            strengths: '',
            weaknesses: '',
            marketShareEstimate: 0
        };
        setFormData({ ...formData, competitors: [...formData.competitors, newComp] });
    };

    const updateCompetitor = (id: string, field: keyof MarketCompetitor, value: any) => {
        if (!formData) return;
        setFormData({
            ...formData,
            competitors: formData.competitors.map(c => c.id === id ? { ...c, [field]: value } : c)
        });
    };

    const removeCompetitor = (id: string) => {
        if (!formData) return;
        setFormData({
            ...formData,
            competitors: formData.competitors.filter(c => c.id !== id)
        });
    };

    // --- Stakeholder Handlers ---
    const addStakeholder = () => {
        if (!formData) return;
        const newStake: StakeholderContact = {
            id: Date.now().toString(),
            name: '',
            role: '',
            organization: '',
            phone: '',
            category: 'Parceiro',
            status: 'A Contatar'
        };
        setFormData({ ...formData, stakeholders: [...formData.stakeholders, newStake] });
    };

    const addGovernmentContact = () => {
        if (!formData) return;
        const newStake: StakeholderContact = {
            id: Date.now().toString(),
            name: '',
            role: 'Secretário',
            organization: 'Prefeitura',
            phone: '',
            category: 'Governo',
            status: 'A Contatar'
        };
        setFormData({ ...formData, stakeholders: [...formData.stakeholders, newStake] });
    }

    const updateStakeholder = (id: string, field: keyof StakeholderContact, value: any) => {
        if (!formData) return;
        setFormData({
            ...formData,
            stakeholders: formData.stakeholders.map(s => s.id === id ? { ...s, [field]: value } : s)
        });
    };

    const removeStakeholder = (id: string) => {
        if (!formData) return;
        setFormData({
            ...formData,
            stakeholders: formData.stakeholders.filter(s => s.id !== id)
        });
    };

    // --- SWOT Handlers ---
    const updateSwotList = (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', text: string) => {
        if (!formData) return;
        // Simple text area to array conversion for simplicity in this UI
        const list = text.split('\n').filter(line => line.trim() !== '');
        setFormData({
            ...formData,
            swot: { ...formData.swot, [type]: list }
        });
    };

    if (!city || !formData) return <div>Carregando...</div>;

    const governmentContacts = formData.stakeholders.filter(s => s.category === 'Governo');

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button 
                    onClick={() => navigate('/inteligencia')} 
                    className="p-2 rounded-full transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                        <FiArrowLeft className="w-6 h-6"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold">Inteligência: {city.name}</h2>
                        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Dados estratégicos e análise de mercado</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center text-white py-2 px-6 rounded-lg transition disabled:opacity-50"
                    style={{ backgroundColor: '#3b82f6' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                    <FiSave className="mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-1" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'overview' ? 'border-b-2' : 'font-bold'}`}
                    style={activeTab === 'overview' 
                        ? { background: 'rgba(255, 255, 255, 0.1)', color: '#3b82f6', borderBottomColor: '#3b82f6' } 
                        : { color: '#ffffff' }
                    }
                    onMouseEnter={(e) => { if (activeTab !== 'overview') e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseLeave={(e) => { if (activeTab !== 'overview') e.currentTarget.style.color = '#ffffff'; }}
                >
                    Visão Geral
                </button>
                <button 
                    onClick={() => setActiveTab('competition')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'competition' ? 'border-b-2' : 'font-bold'}`}
                    style={activeTab === 'competition' 
                        ? { background: 'rgba(255, 255, 255, 0.1)', color: '#3b82f6', borderBottomColor: '#3b82f6' } 
                        : { color: '#ffffff' }
                    }
                    onMouseEnter={(e) => { if (activeTab !== 'competition') e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseLeave={(e) => { if (activeTab !== 'competition') e.currentTarget.style.color = '#ffffff'; }}
                >
                    Concorrência
                </button>
                <button 
                    onClick={() => setActiveTab('stakeholders')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'stakeholders' ? 'border-b-2' : 'font-bold'}`}
                    style={activeTab === 'stakeholders' 
                        ? { background: 'rgba(255, 255, 255, 0.1)', color: '#3b82f6', borderBottomColor: '#3b82f6' } 
                        : { color: '#ffffff' }
                    }
                    onMouseEnter={(e) => { if (activeTab !== 'stakeholders') e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseLeave={(e) => { if (activeTab !== 'stakeholders') e.currentTarget.style.color = '#ffffff'; }}
                >
                    Todos os Stakeholders
                </button>
                <button 
                    onClick={() => setActiveTab('swot')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'swot' ? 'border-b-2' : 'font-bold'}`}
                    style={activeTab === 'swot' 
                        ? { background: 'rgba(255, 255, 255, 0.1)', color: '#3b82f6', borderBottomColor: '#3b82f6' } 
                        : { color: '#ffffff' }
                    }
                    onMouseEnter={(e) => { if (activeTab !== 'swot') e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseLeave={(e) => { if (activeTab !== 'swot') e.currentTarget.style.color = '#ffffff'; }}
                >
                    Análise SWOT
                </button>
            </div>

            {/* Content */}
            
            {/* OVERVIEW TAB (Redesigned) */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* 1. Resumo do Município */}
                    <Card title="Resumo do Município" tooltipText="Descreva os principais motores econômicos da cidade, grandes empresas, safra agrícola, sazonalidade, e características gerais.">
                        <textarea 
                            className="w-full h-32 p-4 rounded-lg backdrop-blur-sm resize-none"
                            style={{ 
                                background: 'rgba(0, 0, 0, 0.2)', 
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff'
                            }}
                            placeholder="Ex: Cidade com forte presença do agronegócio (soja/milho). Pico de movimento entre Fevereiro e Março. População flutuante alta..."
                            value={formData.economicNotes}
                            onChange={(e) => setFormData({ ...formData, economicNotes: e.target.value })}
                        />
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 2. Dados de Contato da Prefeitura */}
                        <Card title="Dados da Prefeitura" className="h-full">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold flex items-center mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}><FiPhone className="mr-2"/> Telefone Geral</label>
                                    <input 
                                        type="text" 
                                        value={formData.cityHallPhone || ''} 
                                        onChange={(e) => setFormData({ ...formData, cityHallPhone: e.target.value })}
                                        placeholder="(65) 3333-0000"
                                        className="w-full p-2 rounded-lg backdrop-blur-sm"
                                        style={{ 
                                            background: 'rgba(0, 0, 0, 0.2)', 
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold flex items-center mb-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}><FiMail className="mr-2"/> Email Geral / Gabinete</label>
                                    <input 
                                        type="text" 
                                        value={formData.cityHallEmail || ''} 
                                        onChange={(e) => setFormData({ ...formData, cityHallEmail: e.target.value })}
                                        placeholder="contato@cidade.mt.gov.br"
                                        className="w-full p-2 rounded-lg backdrop-blur-sm"
                                        style={{ 
                                            background: 'rgba(0, 0, 0, 0.2)', 
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff'
                                        }}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* 3. Concorrência em Números */}
                        <Card title="Concorrência em Números" className="h-full">
                             <div className="flex items-center justify-between h-full py-4">
                                <div className="flex items-center">
                                    <div className="p-4 rounded-full mr-4" style={{ backgroundColor: 'rgba(246, 39, 24, 0.2)', color: '#f62718' }}>
                                        <FiTarget size={32} />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold">{formData.competitors.length}</p>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Concorrentes Cadastrados</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('competition')}
                                    className="text-sm hover:underline"
                                    style={{ color: '#3b82f6' }}
                                >
                                    Ver Detalhes
                                </button>
                             </div>
                        </Card>
                    </div>

                    {/* 4. Gestão de Contatos Governamentais */}
                    <Card 
                        title="Contatos Governamentais" 
                        tooltipText="Adicione contatos específicos como Prefeito, Secretários (Transporte, Obras) e Vereadores."
                    >
                         <div className="overflow-x-auto dt-table-container">
                            <table className="w-full text-left mb-4 dt-table">
                                <thead style={{ background: 'rgba(55, 65, 81, 0.9)', borderBottom: '2px solid rgba(59, 130, 246, 0.5)' }}>
                                    <tr>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Nome</th>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Cargo</th>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Telefone</th>
                                        <th className="p-3 w-1/4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Email</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {governmentContacts.map((stake, index) => (
                                        <tr 
                                            key={stake.id} 
                                            className="hover:bg-gray-700/40 transition-colors"
                                            style={{ 
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: index % 2 === 0 ? 'rgba(55, 65, 81, 0.3)' : 'transparent'
                                            }}
                                        >
                                            <td className="p-3">
                                                 <input 
                                                    type="text" 
                                                    value={stake.name} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Nome"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.role} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'role', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Ex: Secretário"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.phone} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'phone', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Telefone Direto"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.email || ''} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'email', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Email Direto"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <button 
                                                    onClick={() => removeStakeholder(stake.id)} 
                                                    className="transition"
                                                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f62718'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {governmentContacts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center font-medium italic" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                Nenhum contato governamental adicionado ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button 
                            onClick={addGovernmentContact} 
                            className="w-full py-2 border-2 border-dashed rounded-lg font-bold transition-colors flex items-center justify-center"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        >
                            <FiPlus className="mr-2"/> Adicionar Prefeito / Secretário / Vereador
                        </button>
                    </Card>
                </div>
            )}

            {/* COMPETITION TAB */}
            {activeTab === 'competition' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Análise da Concorrência</h3>
                        <button 
                            onClick={addCompetitor} 
                            className="flex items-center text-sm text-white px-3 py-1.5 rounded-lg transition"
                            style={{ backgroundColor: '#17a2b8' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(23, 162, 184, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
                        >
                            <FiPlus className="mr-1"/> Adicionar Concorrente
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formData.competitors.map(comp => (
                            <div 
                                key={comp.id} 
                                className="backdrop-blur-sm rounded-xl p-4 shadow-sm relative group"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)', 
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <button 
                                    onClick={() => removeCompetitor(comp.id)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f62718'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                                >
                                    <FiTrash2 />
                                </button>

                                <input 
                                    type="text" 
                                    value={comp.name} 
                                    onChange={(e) => updateCompetitor(comp.id, 'name', e.target.value)}
                                    className="font-bold text-lg bg-transparent border-b border-transparent w-full mb-2 focus:outline-none"
                                    style={{ color: '#ffffff' }}
                                    placeholder="Nome do Concorrente"
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                    onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = 'transparent'; }}
                                />

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Nível de Preço</label>
                                        <select 
                                            value={comp.priceLevel}
                                            onChange={(e) => updateCompetitor(comp.id, 'priceLevel', e.target.value)}
                                            className="w-full p-1 backdrop-blur-sm rounded text-sm"
                                            style={{ background: 'rgba(0, 0, 0, 0.2)', color: '#ffffff' }}
                                        >
                                            <option value="Baixo">Baixo (Econômico)</option>
                                            <option value="Médio">Médio</option>
                                            <option value="Alto">Alto (Premium)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pontos Fortes</label>
                                        <textarea 
                                            value={comp.strengths}
                                            onChange={(e) => updateCompetitor(comp.id, 'strengths', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 backdrop-blur-sm rounded text-sm resize-none"
                                            style={{ background: 'rgba(8, 165, 14, 0.1)', color: '#ffffff' }}
                                            placeholder="Ex: Tempo de espera baixo..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pontos Fracos</label>
                                        <textarea 
                                            value={comp.weaknesses}
                                            onChange={(e) => updateCompetitor(comp.id, 'weaknesses', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 backdrop-blur-sm rounded text-sm resize-none"
                                            style={{ background: 'rgba(246, 39, 24, 0.1)', color: '#ffffff' }}
                                            placeholder="Ex: App trava muito..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {formData.competitors.length === 0 && (
                            <div 
                                className="col-span-full py-10 text-center font-medium backdrop-blur-sm rounded-xl border border-dashed"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)', 
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.8)'
                                }}
                            >
                                Nenhum concorrente registrado.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STAKEHOLDERS TAB */}
            {activeTab === 'stakeholders' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Todos os Stakeholders & Contatos Chave</h3>
                        <button 
                            onClick={addStakeholder} 
                            className="flex items-center text-sm text-white px-3 py-1.5 rounded-lg transition"
                            style={{ backgroundColor: '#17a2b8' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(23, 162, 184, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
                        >
                            <FiPlus className="mr-1"/> Adicionar Contato
                        </button>
                    </div>

                    <div className="overflow-x-auto dt-table-container rounded-xl">
                        <table className="w-full text-left dt-table">
                            <thead style={{ background: 'rgba(55, 65, 81, 0.9)', borderBottom: '2px solid rgba(59, 130, 246, 0.5)' }}>
                                <tr>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Nome</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Cargo/Org</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Contato</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Categoria</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 80%)' }}>Status</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.stakeholders.map((stake, index) => (
                                    <tr 
                                        key={stake.id} 
                                        className="last:border-0 transition-colors hover:bg-gray-700/40"
                                        style={{ 
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                            background: index % 2 === 0 ? 'rgba(55, 65, 81, 0.3)' : 'transparent'
                                        }}
                                    >
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                value={stake.name} 
                                                onChange={(e) => updateStakeholder(stake.id, 'name', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent focus:outline-none"
                                                style={{ color: '#ffffff' }}
                                                placeholder="Nome do Contato"
                                                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                 <input 
                                                    type="text" 
                                                    value={stake.role} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'role', e.target.value)}
                                                    className="w-full text-sm bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: '#ffffff' }}
                                                    placeholder="Cargo"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                                 <input 
                                                    type="text" 
                                                    value={stake.organization} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'organization', e.target.value)}
                                                    className="w-full text-xs bg-transparent border-b border-transparent focus:outline-none"
                                                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                    placeholder="Organização"
                                                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center">
                                                    <FiPhone className="mr-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}/>
                                                    <input 
                                                        type="text" 
                                                        value={stake.phone} 
                                                        onChange={(e) => updateStakeholder(stake.id, 'phone', e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none"
                                                        style={{ color: '#ffffff' }}
                                                        placeholder="Telefone"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <FiMail className="mr-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}/>
                                                    <input 
                                                        type="text" 
                                                        value={stake.email || ''} 
                                                        onChange={(e) => updateStakeholder(stake.id, 'email', e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none"
                                                        style={{ color: '#ffffff' }}
                                                        placeholder="Email"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select 
                                                value={stake.category} 
                                                onChange={(e) => updateStakeholder(stake.id, 'category', e.target.value)}
                                                className="backdrop-blur-sm p-1 rounded text-sm"
                                                style={{ background: 'rgba(0, 0, 0, 0.2)', color: '#ffffff' }}
                                            >
                                                <option>Governo</option>
                                                <option>Mídia</option>
                                                <option>Parceiro</option>
                                                <option>Influenciador</option>
                                                <option>Outro</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                             <select 
                                                value={stake.status} 
                                                onChange={(e) => updateStakeholder(stake.id, 'status', e.target.value)}
                                                className="p-1 rounded text-xs font-bold text-white"
                                                style={{
                                                    backgroundColor: stake.status === 'Parceria Firmada' 
                                                        ? '#08a50e' 
                                                        : stake.status === 'Em Negociação' 
                                                            ? '#ffc107' 
                                                            : 'rgba(255, 255, 255, 0.1)',
                                                    color: stake.status === 'Em Negociação' ? '#000000' : '#ffffff'
                                                }}
                                            >
                                                <option>A Contatar</option>
                                                <option>Em Negociação</option>
                                                <option>Parceria Firmada</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => removeStakeholder(stake.id)} 
                                                className="transition"
                                                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#f62718'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {formData.stakeholders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Nenhum contato registrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SWOT TAB */}
            {activeTab === 'swot' && (
                <div>
                     <h3 className="text-lg font-bold mb-4">Análise SWOT (F.O.F.A.)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <Card title="Forças (Strengths)" className="border-t-4" style={{ borderTopColor: '#08a50e' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Vantagens internas em relação à cidade.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #08a50e'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Marca forte na região vizinha&#10;- Equipe local já contratada"
                                value={formData.swot.strengths.join('\n')}
                                onChange={(e) => updateSwotList('strengths', e.target.value)}
                             />
                        </Card>

                        {/* Weaknesses */}
                        <Card title="Fraquezas (Weaknesses)" className="border-t-4" style={{ borderTopColor: '#f62718' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Desvantagens internas.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #f62718'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Orçamento limitado de marketing&#10;- App ainda sem motoristas cadastrados"
                                value={formData.swot.weaknesses.join('\n')}
                                onChange={(e) => updateSwotList('weaknesses', e.target.value)}
                             />
                        </Card>

                        {/* Opportunities */}
                        <Card title="Oportunidades (Opportunities)" className="border-t-4" style={{ borderTopColor: '#17a2b8' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Fatores externos positivos.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #17a2b8'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Concorrente principal aumentou preços&#10;- Evento agropecuário em breve"
                                value={formData.swot.opportunities.join('\n')}
                                onChange={(e) => updateSwotList('opportunities', e.target.value)}
                             />
                        </Card>

                         {/* Threats */}
                         <Card title="Ameaças (Threats)" className="border-t-4" style={{ borderTopColor: '#ffc107' }}>
                             <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Fatores externos negativos.</p>
                             <textarea 
                                className="w-full h-40 p-3 backdrop-blur-sm rounded border-none"
                                style={{ 
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    color: '#ffffff'
                                }}
                                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 1px #ffc107'}
                                onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                placeholder="- Novo app entrando no mercado&#10;- Regulação municipal mais rígida"
                                value={formData.swot.threats.join('\n')}
                                onChange={(e) => updateSwotList('threats', e.target.value)}
                             />
                        </Card>
                     </div>
                </div>
            )}
        </div>
    );
};

export default CityMarketAnalysis;