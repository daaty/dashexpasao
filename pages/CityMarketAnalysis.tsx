
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
                    <button onClick={() => navigate('/inteligencia')} className="p-2 rounded-full hover:bg-base-200 dark:hover:bg-dark-100 transition">
                        <FiArrowLeft className="w-6 h-6"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold">Inteligência: {city.name}</h2>
                        <p className="text-sm text-gray-500">Dados estratégicos e análise de mercado</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
                >
                    <FiSave className="mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 border-b border-base-300 dark:border-dark-100 pb-1">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'overview' ? 'bg-base-200 dark:bg-dark-100 text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Visão Geral
                </button>
                <button 
                    onClick={() => setActiveTab('competition')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'competition' ? 'bg-base-200 dark:bg-dark-100 text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Concorrência
                </button>
                <button 
                    onClick={() => setActiveTab('stakeholders')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'stakeholders' ? 'bg-base-200 dark:bg-dark-100 text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Todos os Stakeholders
                </button>
                <button 
                    onClick={() => setActiveTab('swot')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'swot' ? 'bg-base-200 dark:bg-dark-100 text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
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
                            className="w-full h-32 p-4 rounded-lg bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary resize-none"
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
                                    <label className="text-sm font-semibold flex items-center mb-1 text-gray-500"><FiPhone className="mr-2"/> Telefone Geral</label>
                                    <input 
                                        type="text" 
                                        value={formData.cityHallPhone || ''} 
                                        onChange={(e) => setFormData({ ...formData, cityHallPhone: e.target.value })}
                                        placeholder="(65) 3333-0000"
                                        className="w-full p-2 rounded-lg bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold flex items-center mb-1 text-gray-500"><FiMail className="mr-2"/> Email Geral / Gabinete</label>
                                    <input 
                                        type="text" 
                                        value={formData.cityHallEmail || ''} 
                                        onChange={(e) => setFormData({ ...formData, cityHallEmail: e.target.value })}
                                        placeholder="contato@cidade.mt.gov.br"
                                        className="w-full p-2 rounded-lg bg-base-200 dark:bg-dark-300 border border-base-300 dark:border-dark-100 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* 3. Concorrência em Números */}
                        <Card title="Concorrência em Números" className="h-full">
                             <div className="flex items-center justify-between h-full py-4">
                                <div className="flex items-center">
                                    <div className="p-4 bg-red-100 text-red-600 rounded-full mr-4">
                                        <FiTarget size={32} />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold">{formData.competitors.length}</p>
                                        <p className="text-gray-500">Concorrentes Cadastrados</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('competition')}
                                    className="text-sm text-primary hover:underline"
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
                         <div className="overflow-x-auto">
                            <table className="w-full text-left mb-4">
                                <thead className="bg-base-200 dark:bg-dark-300 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="p-3 w-1/4">Nome</th>
                                        <th className="p-3 w-1/4">Cargo</th>
                                        <th className="p-3 w-1/4">Telefone</th>
                                        <th className="p-3 w-1/4">Email</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {governmentContacts.map(stake => (
                                        <tr key={stake.id} className="border-b border-base-200 dark:border-dark-100">
                                            <td className="p-3">
                                                 <input 
                                                    type="text" 
                                                    value={stake.name} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none placeholder-gray-400"
                                                    placeholder="Nome"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.role} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'role', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none placeholder-gray-400"
                                                    placeholder="Ex: Secretário"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.phone} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'phone', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none placeholder-gray-400"
                                                    placeholder="Telefone Direto"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    value={stake.email || ''} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'email', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none placeholder-gray-400"
                                                    placeholder="Email Direto"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => removeStakeholder(stake.id)} className="text-gray-400 hover:text-red-500">
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {governmentContacts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                                                Nenhum contato governamental adicionado ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={addGovernmentContact} className="w-full py-2 border-2 border-dashed border-base-300 dark:border-dark-100 rounded-lg text-gray-500 hover:text-primary hover:border-primary transition-colors flex items-center justify-center">
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
                        <button onClick={addCompetitor} className="flex items-center text-sm bg-secondary text-white px-3 py-1.5 rounded-lg hover:bg-blue-600">
                            <FiPlus className="mr-1"/> Adicionar Concorrente
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formData.competitors.map(comp => (
                            <div key={comp.id} className="bg-base-100 dark:bg-dark-200 border border-base-300 dark:border-dark-100 rounded-xl p-4 shadow-sm relative group">
                                <button 
                                    onClick={() => removeCompetitor(comp.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FiTrash2 />
                                </button>

                                <input 
                                    type="text" 
                                    value={comp.name} 
                                    onChange={(e) => updateCompetitor(comp.id, 'name', e.target.value)}
                                    className="font-bold text-lg bg-transparent border-b border-transparent hover:border-gray-300 w-full mb-2 focus:outline-none focus:border-primary"
                                    placeholder="Nome do Concorrente"
                                />

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 font-semibold uppercase">Nível de Preço</label>
                                        <select 
                                            value={comp.priceLevel}
                                            onChange={(e) => updateCompetitor(comp.id, 'priceLevel', e.target.value)}
                                            className="w-full p-1 bg-base-200 dark:bg-dark-300 rounded text-sm"
                                        >
                                            <option value="Baixo">Baixo (Econômico)</option>
                                            <option value="Médio">Médio</option>
                                            <option value="Alto">Alto (Premium)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 font-semibold uppercase">Pontos Fortes</label>
                                        <textarea 
                                            value={comp.strengths}
                                            onChange={(e) => updateCompetitor(comp.id, 'strengths', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm resize-none"
                                            placeholder="Ex: Tempo de espera baixo..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 font-semibold uppercase">Pontos Fracos</label>
                                        <textarea 
                                            value={comp.weaknesses}
                                            onChange={(e) => updateCompetitor(comp.id, 'weaknesses', e.target.value)}
                                            rows={2}
                                            className="w-full p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm resize-none"
                                            placeholder="Ex: App trava muito..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {formData.competitors.length === 0 && (
                            <div className="col-span-full py-10 text-center text-gray-400 bg-base-200 dark:bg-dark-100 rounded-xl border border-dashed border-gray-300">
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
                        <button onClick={addStakeholder} className="flex items-center text-sm bg-secondary text-white px-3 py-1.5 rounded-lg hover:bg-blue-600">
                            <FiPlus className="mr-1"/> Adicionar Contato
                        </button>
                    </div>

                    <div className="overflow-x-auto bg-base-100 dark:bg-dark-200 rounded-xl border border-base-300 dark:border-dark-100">
                        <table className="w-full text-left">
                            <thead className="bg-base-200 dark:bg-dark-300 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Cargo/Org</th>
                                    <th className="p-4">Contato</th>
                                    <th className="p-4">Categoria</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.stakeholders.map(stake => (
                                    <tr key={stake.id} className="border-b border-base-200 dark:border-dark-100 last:border-0 hover:bg-base-200 dark:hover:bg-dark-100">
                                        <td className="p-4">
                                            <input 
                                                type="text" 
                                                value={stake.name} 
                                                onChange={(e) => updateStakeholder(stake.id, 'name', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                                placeholder="Nome do Contato"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                 <input 
                                                    type="text" 
                                                    value={stake.role} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'role', e.target.value)}
                                                    className="w-full text-sm bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                                    placeholder="Cargo"
                                                />
                                                 <input 
                                                    type="text" 
                                                    value={stake.organization} 
                                                    onChange={(e) => updateStakeholder(stake.id, 'organization', e.target.value)}
                                                    className="w-full text-xs text-gray-500 bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                                                    placeholder="Organização"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center">
                                                    <FiPhone className="mr-2 text-gray-400"/>
                                                    <input 
                                                        type="text" 
                                                        value={stake.phone} 
                                                        onChange={(e) => updateStakeholder(stake.id, 'phone', e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none"
                                                        placeholder="Telefone"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <FiMail className="mr-2 text-gray-400"/>
                                                    <input 
                                                        type="text" 
                                                        value={stake.email || ''} 
                                                        onChange={(e) => updateStakeholder(stake.id, 'email', e.target.value)}
                                                        className="w-full bg-transparent focus:outline-none"
                                                        placeholder="Email"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select 
                                                value={stake.category} 
                                                onChange={(e) => updateStakeholder(stake.id, 'category', e.target.value)}
                                                className="bg-base-200 dark:bg-dark-300 p-1 rounded text-sm"
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
                                                className={`p-1 rounded text-xs font-bold text-white ${
                                                    stake.status === 'Parceria Firmada' ? 'bg-green-500' : 
                                                    stake.status === 'Em Negociação' ? 'bg-orange-500' : 
                                                    'bg-gray-400'
                                                }`}
                                            >
                                                <option>A Contatar</option>
                                                <option>Em Negociação</option>
                                                <option>Parceria Firmada</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => removeStakeholder(stake.id)} className="text-gray-400 hover:text-red-500">
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {formData.stakeholders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum contato registrado.</td>
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
                        <Card title="Forças (Strengths)" className="border-t-4 border-t-green-500">
                             <p className="text-xs text-gray-500 mb-2">Vantagens internas em relação à cidade.</p>
                             <textarea 
                                className="w-full h-40 p-3 bg-base-200 dark:bg-dark-300 rounded border-none focus:ring-1 focus:ring-green-500"
                                placeholder="- Marca forte na região vizinha&#10;- Equipe local já contratada"
                                value={formData.swot.strengths.join('\n')}
                                onChange={(e) => updateSwotList('strengths', e.target.value)}
                             />
                        </Card>

                        {/* Weaknesses */}
                        <Card title="Fraquezas (Weaknesses)" className="border-t-4 border-t-red-500">
                             <p className="text-xs text-gray-500 mb-2">Desvantagens internas.</p>
                             <textarea 
                                className="w-full h-40 p-3 bg-base-200 dark:bg-dark-300 rounded border-none focus:ring-1 focus:ring-red-500"
                                placeholder="- Orçamento limitado de marketing&#10;- App ainda sem motoristas cadastrados"
                                value={formData.swot.weaknesses.join('\n')}
                                onChange={(e) => updateSwotList('weaknesses', e.target.value)}
                             />
                        </Card>

                        {/* Opportunities */}
                        <Card title="Oportunidades (Opportunities)" className="border-t-4 border-t-blue-500">
                             <p className="text-xs text-gray-500 mb-2">Fatores externos positivos.</p>
                             <textarea 
                                className="w-full h-40 p-3 bg-base-200 dark:bg-dark-300 rounded border-none focus:ring-1 focus:ring-blue-500"
                                placeholder="- Concorrente principal aumentou preços&#10;- Evento agropecuário em breve"
                                value={formData.swot.opportunities.join('\n')}
                                onChange={(e) => updateSwotList('opportunities', e.target.value)}
                             />
                        </Card>

                         {/* Threats */}
                         <Card title="Ameaças (Threats)" className="border-t-4 border-t-orange-500">
                             <p className="text-xs text-gray-500 mb-2">Fatores externos negativos.</p>
                             <textarea 
                                className="w-full h-40 p-3 bg-base-200 dark:bg-dark-300 rounded border-none focus:ring-1 focus:ring-orange-500"
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