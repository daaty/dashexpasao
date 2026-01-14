
import React, { useState, useRef, useEffect, useContext } from 'react';
import Card from '../components/ui/Card';
import { FiSend, FiCpu, FiUser } from 'react-icons/fi';
import { ChatMessage, ChatMessageSender } from '../types';
import { generateAiResponse } from '../services/geminiService';
import Spinner from '../components/ui/Spinner';
import ReactMarkdown from 'react-markdown';
import InfoTooltip from '../components/ui/InfoTooltip';
import { DataContext } from '../context/DataContext';

interface QuickSuggestionProps {
    text: string;
    onSelect: (text: string) => void;
}

// FIX: Define QuickSuggestion as a React.FC to correctly handle props like 'key' in mapped lists.
const QuickSuggestion: React.FC<QuickSuggestionProps> = ({ text, onSelect }) => (
    <button onClick={() => onSelect(text)} className="bg-base-100 dark:bg-dark-100 border border-base-300 dark:border-dark-200 text-sm px-4 py-2 rounded-lg hover:bg-base-200 dark:hover:bg-dark-200 transition text-left">
        {text}
    </button>
);

const AIAssistant: React.FC = () => {
    const { cities, isLoading: isDataLoading } = useContext(DataContext);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', sender: ChatMessageSender.AI, text: 'Olá! Sou o Assistente Urban AI. Como posso ajudar na sua análise de expansão hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (prompt?: string) => {
        const userMessageText = prompt || input;
        if (userMessageText.trim() === '' || isLoading) return;
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: ChatMessageSender.User,
            text: userMessageText
        };

        const loadingMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: ChatMessageSender.AI,
            text: '',
            isLoading: true
        };
        
        setMessages(prev => [...prev, userMessage, loadingMessage]);
        setInput('');
        setIsLoading(true);
        
        try {
            const aiResponseText = await generateAiResponse(userMessageText, cities);
            const aiMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                sender: ChatMessageSender.AI,
                text: aiResponseText
            };
            setMessages(prev => [...prev.slice(0, -1), aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                sender: ChatMessageSender.AI,
                text: "Desculpe, ocorreu um erro. Por favor, tente novamente."
            };
            setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSend(suggestion);
    }

    const suggestions = [
        "Qual cidade no norte de MT tem o melhor potencial para expansão?",
        "Compare o potencial de Cuiabá e Várzea Grande.",
        "Liste as 3 cidades não atendidas com maior população entre 15-44 anos.",
        "Qual o ROI esperado para Nova Mutum em 6 meses?"
    ];

    return (
        <div className="h-full flex flex-col">
            <Card className="flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Assistente Urban AI</h3>
                  <InfoTooltip text="O assistente de IA utiliza os dados das 50 cidades mais populosas do MT para responder suas perguntas. Ele pode realizar comparações, identificar potenciais e resumir informações para agilizar sua análise." />
                </div>
                {/* Chat Area */}
                <div className="flex-grow overflow-y-auto pr-4 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === ChatMessageSender.User ? 'justify-end' : ''}`}>
                             {msg.sender === ChatMessageSender.AI && <div className="p-2 rounded-full bg-primary/20 text-primary"><FiCpu/></div>}
                             <div className={`max-w-xl p-4 rounded-xl ${msg.sender === ChatMessageSender.User ? 'bg-primary text-white rounded-br-none' : 'bg-base-200 dark:bg-dark-100 rounded-bl-none'}`}>
                                {msg.isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <Spinner className="w-4 h-4" /> <span>Analisando...</span>
                                    </div>
                                ) : (
                                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{msg.text}</ReactMarkdown>
                                )}
                            </div>
                             {msg.sender === ChatMessageSender.User && <div className="p-2 rounded-full bg-secondary/20 text-secondary"><FiUser/></div>}
                        </div>
                    ))}
                     <div ref={messagesEndRef} />
                </div>
                
                {/* Suggestions */}
                <div className="py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestions.map((s, index) => <QuickSuggestion key={index} text={s} onSelect={handleSuggestionClick} />)}
                    </div>
                </div>

                {/* Input Area */}
                <div className="mt-auto pt-4 border-t border-base-300 dark:border-dark-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isDataLoading ? "Aguardando dados do IBGE..." : "Pergunte algo ao assistente..."}
                            className="w-full p-4 pr-12 rounded-lg bg-base-200 dark:bg-dark-100 border border-base-300 dark:border-dark-200 focus:ring-primary focus:border-primary"
                            disabled={isLoading || isDataLoading}
                        />
                        <button onClick={() => handleSend()} disabled={isLoading || isDataLoading} className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-primary-600 disabled:bg-gray-400">
                           <FiSend/>
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AIAssistant;
