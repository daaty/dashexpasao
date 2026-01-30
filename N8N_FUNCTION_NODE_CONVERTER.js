/**
 * 🔧 FUNCTION NODE PRONTO PARA COPIAR/COLAR NO N8N
 * 
 * Use este código em um nó "Function" ANTES do PostgreSQL node
 * Ele converte todos os dados para os tipos corretos
 * 
 * Passo 1: Adicione um nó "Function" no seu workflow
 * Passo 2: Cole este código
 * Passo 3: Execute
 * 
 * Saída: Dados convertidos corretamente para inserir no PostgreSQL
 */

return items.map(item => {
  const data = item.json;
  
  // Função auxiliar para converter moeda
  function converterMoeda(valor) {
    if (typeof valor === 'number') return valor;
    if (!valor) return null;
    
    // Remove "R$ " e espaços
    let str = String(valor).replace(/R\$\s?/g, '').trim();
    // Remove espaços
    str = str.replace(/\s/g, '');
    // Se tem vírgula, é formato brasileiro: 1.234,56
    if (str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(str) || null;
  }
  
  // Função auxiliar para converter booleano
  function converterBooleano(valor) {
    if (typeof valor === 'boolean') return valor;
    const str = String(valor).toLowerCase().trim();
    return ['true', 'sim', 's', '1', 'yes', 'y'].includes(str);
  }
  
  // Função auxiliar para validar CNPJ
  function validarCNPJ(cnpj) {
    const limpo = String(cnpj || '').replace(/\D/g, '');
    return limpo.length === 14;
  }
  
  // Função auxiliar para limpar telefone
  function limparTelefone(tel) {
    return String(tel || '').replace(/[^\d+]/g, '').replace(/^0/, '');
  }
  
  // Função para gerar UUID válido a partir de qualquer string
  function gerarUUIDValido(valor) {
    // Se já é um UUID válido, retorna
    if (String(valor || '').match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return valor;
    }
    
    // Se vazio, deixa o banco gerar (não enviar o campo)
    if (!valor) return undefined;
    
    // Converte string para UUID determinístico usando hash simples
    const str = String(valor);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Mantém em 32-bit
    }
    
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return `${hex}0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
  }
  
  // Função para validar UUID
  function validarUUID(uuid) {
    return String(uuid || '').match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
  }
  
  // NÃO incluir 'id' - PostgreSQL SEMPRE gera novo UUID
  // Ignora qualquer 'id' que venha do formulário
  const resultado = {
    // Conversões de tipo
    valido: converterBooleano(data.valido),
    agendado: converterBooleano(data.agendado),
    tipo: String(data.tipo || '').trim() || null,
    id_transacao: String(data.id_transacao || '').trim() || null,
    data: data.data ? new Date(data.data).toISOString() : null,
    hora: String(data.hora || '').trim() || null,
    valor_extraido: converterMoeda(data.valor_extraido),
    pagador: String(data.pagador || '').trim() || null,
    recebedor: String(data.recebedor || '').trim() || null,
    cnpj_recebedor: String(data.cnpj_recebedor || '').replace(/\D/g, '') || null,
    cnpj_valido: validarCNPJ(data.cnpj_recebedor),
    status_recebedor: String(data.status_recebedor || '').trim() || null,
    creditos_calculados: converterMoeda(data.creditos_calculados),
    remetente_whatsapp: limparTelefone(data.remetente_whatsapp),
    // NÃO incluir 'id' aqui - deixa PostgreSQL gerar via @default(uuid())
  };
  
  return resultado;
});
