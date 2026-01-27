import { Client, QueryResult } from 'pg';
import logger from '../config/logger';

/**
 * Cliente singleton para conexão com o banco de dados N8N
 * Gerencia dados reais de corridas da tabela dashboard.rides
 */
class N8NDatabase {
  private client: Client | null = null;
  private connectionString: string;
  private isConnected: boolean = false;

  constructor() {
    this.connectionString = process.env.N8N_DATABASE_URL || '';
  }

  /**
   * Conecta ao banco de dados N8N
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    if (!this.connectionString) {
      logger.warn('N8N_DATABASE_URL não configurada. Dados de corridas não estarão disponíveis.');
      return;
    }

    try {
      this.client = new Client({
        connectionString: this.connectionString,
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info('✅ Conectado ao banco de dados N8N');
    } catch (error) {
      logger.error('❌ Erro ao conectar ao banco N8N:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Executa uma query no banco N8N
   */
  async query<T extends Record<string, any> = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error('Cliente N8N não está conectado');
    }

    try {
      return await this.client.query<T>(sql, params);
    } catch (error) {
      logger.error('❌ Erro ao executar query no banco N8N:', error);
      throw error;
    }
  }

  /**
   * Verifica se o banco está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.connect();
      return this.isConnected;
    } catch {
      return false;
    }
  }

  /**
   * Desconecta do banco
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.isConnected = false;
      this.client = null;
      logger.info('🔌 Desconectado do banco N8N');
    }
  }

  /**
   * Verifica se a tabela rides existe
   */
  async ridesTableExists(): Promise<boolean> {
    try {
      const result = await this.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'dashboard' 
          AND table_name = 'rides'
        );
      `);
      return result.rows[0].exists;
    } catch {
      return false;
    }
  }
}

// Exportar instância singleton
export const n8nDatabase = new N8NDatabase();

export default n8nDatabase;
