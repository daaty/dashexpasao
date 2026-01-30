/**
 * Funções de conversão e limpeza de dados para tabela Autorecarga
 * Usadas pelo n8n para processar dados antes de inserir no PostgreSQL
 */

/**
 * Converte valor em formato de moeda brasileira para número
 * @param valorFormatado - Ex: "R$ 1.234,56"
 * @returns número - Ex: 1234.56
 */
export function converterMoedaBRL(valorFormatado: string | number): number {
  if (typeof valorFormatado === 'number') {
    return valorFormatado;
  }

  if (!valorFormatado) {
    return 0;
  }

  // Remove "R$ " ou "R$"
  let valor = String(valorFormatado).replace(/R\$\s?/g, '').trim();

  // Remove espaços
  valor = valor.replace(/\s/g, '');

  // Se tem ponto e vírgula, assume formato brasileiro: 1.234,56
  if (valor.includes(',')) {
    valor = valor.replace(/\./g, '').replace(',', '.');
  }

  return parseFloat(valor);
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns booleano indicando se é válido
 */
export function validarCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove formatação
  const cnpjLimpo = String(cnpj).replace(/\D/g, '');

  // Deve ter 14 dígitos
  if (cnpjLimpo.length !== 14) return false;

  // Verifica se não é sequência de números iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;

  // Cálculo do primeiro dígito verificador
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  let digitos = cnpjLimpo.substring(tamanho);

  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  // Cálculo do segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

/**
 * Formata CNPJ para padrão XX.XXX.XXX/XXXX-XX
 * @param cnpj - CNPJ com apenas números
 * @returns CNPJ formatado
 */
export function formatarCNPJ(cnpj: string): string {
  if (!cnpj) return '';

  const cnpjLimpo = String(cnpj).replace(/\D/g, '');

  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Extrai números de telefone/WhatsApp
 * Mantém apenas dígitos e + (para formato internacional)
 * @param telefone - Telefone com formatação
 * @returns apenas números e opcionalmente +
 */
export function limparTelefone(telefone: string): string {
  if (!telefone) return '';

  return String(telefone)
    .replace(/[^\d+]/g, '')
    .replace(/^0/, ''); // Remove possível 0 inicial
}

/**
 * Converte string "sim"/"não" ou "true"/"false" para booleano
 * @param valor - String com valor booleano
 * @returns booleano
 */
export function converterBooleano(valor: any): boolean {
  if (typeof valor === 'boolean') return valor;

  const stringValor = String(valor).toLowerCase().trim();

  return (
    stringValor === 'true' ||
    stringValor === 'sim' ||
    stringValor === 's' ||
    stringValor === '1' ||
    stringValor === 'yes' ||
    stringValor === 'y'
  );
}

/**
 * Limpa e valida dados para inserção
 * @param dados - Objeto com dados da transação
 * @returns objeto limpo e validado
 */
export function limparDadosAutorecarga(dados: any) {
  return {
    valido: dados.valido !== undefined ? converterBooleano(dados.valido) : false,
    agendado: dados.agendado !== undefined ? converterBooleano(dados.agendado) : false,
    tipo: String(dados.tipo || '').trim() || null,
    id_transacao: String(dados.id_transacao || '').trim() || null,
    data: dados.data ? new Date(dados.data) : null,
    hora: String(dados.hora || '').trim() || null,
    valor_extraido: dados.valor_extraido ? converterMoedaBRL(dados.valor_extraido) : null,
    pagador: String(dados.pagador || '').trim() || null,
    recebedor: String(dados.recebedor || '').trim() || null,
    cnpj_recebedor: String(dados.cnpj_recebedor || '').replace(/\D/g, '') || null,
    cnpj_valido: dados.cnpj_recebedor
      ? validarCNPJ(String(dados.cnpj_recebedor))
      : false,
    status_recebedor: String(dados.status_recebedor || '').trim() || null,
    creditos_calculados: dados.creditos_calculados
      ? converterMoedaBRL(dados.creditos_calculados)
      : null,
    remetente_whatsapp: limparTelefone(dados.remetente_whatsapp || ''),
  };
}

// Exportar como objeto para facilitar uso no n8n
export default {
  converterMoedaBRL,
  validarCNPJ,
  formatarCNPJ,
  limparTelefone,
  converterBooleano,
  limparDadosAutorecarga,
};
