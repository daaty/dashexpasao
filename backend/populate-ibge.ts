
import { PrismaClient, CityStatus as PrismaCityStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Interfaces para tipar a resposta do IBGE
interface IbgeResponse {
  id: string;
  variavel: string;
  unidade: string;
  resultados: Array<{
    classificacoes: any[];
    series: Array<{
        localidade: { id: string; nome: string };
        serie: { [key: string]: string };
    }>;
  }>;
}

interface IbgeCityBase {
    id: number;
    nome: string;
    microrregiao: {
        mesorregiao: {
            nome: string;
        }
    }
}

// Mapa de Mesorregiões
enum Mesorregion {
  NORTE_MATOGROSSENSE = 'NORTE_MATOGROSSENSE',
  NORDESTE_MATOGROSSENSE = 'NORDESTE_MATOGROSSENSE',
  CENTRO_SUL_MATOGROSSENSE = 'CENTRO_SUL_MATOGROSSENSE',
  SUDESTE_MATOGROSSENSE = 'SUDESTE_MATOGROSSENSE',
  SUDOESTE_MATOGROSSENSE = 'SUDOESTE_MATOGROSSENSE',
}

function mapMesorregion(mesoNome: string): Mesorregion {
    if (mesoNome.includes('Norte')) return Mesorregion.NORTE_MATOGROSSENSE;
    if (mesoNome.includes('Nordeste')) return Mesorregion.NORDESTE_MATOGROSSENSE;
    if (mesoNome.includes('Sudeste')) return Mesorregion.SUDESTE_MATOGROSSENSE;
    if (mesoNome.includes('Sudoeste')) return Mesorregion.SUDOESTE_MATOGROSSENSE;
    if (mesoNome.includes('Centro-Sul')) return Mesorregion.CENTRO_SUL_MATOGROSSENSE;
    return Mesorregion.CENTRO_SUL_MATOGROSSENSE; // Fallback
}

async function fetchInitialData() {
    console.log("📡 Buscando lista de municípios do Mato Grosso...");
    try {
        const cityListRes = await axios.get<IbgeCityBase[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios');
        const cityList = cityListRes.data;
        console.log(`📍 ${cityList.length} municípios encontrados.`);

        console.log("📡 Buscando dados agregados (População, PIB, Empregos)...");
        
        // Helper para requisições seguras
        const fetchSafe = async (url: string) => {
            try {
                return await axios.get<IbgeResponse[]>(url);
            } catch (e) {
                console.warn(`⚠️ Falha na requisição segura [${url}]:`, e);
                return { data: [] }; 
            }
        };

        // Population (Censo 2022) - All MT cities
        const popPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/-1/variaveis/93?localidades=N6[N3[51]]');
        
        // PIB per capita (Proxy for Income)
        const pibPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/-1/variaveis/37?localidades=N6[N3[51]]');
        
        // Jobs (CEMPRE - Variável 165) and Salaries (CEMPRE - Variável 2078)
        // Note: Endpoint 1685 is currently returning 500 Error. Skipping for now.
        // const jobsPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/1685/periodos/-1/variaveis/165?localidades=N6[N3[51]]');
        // const salaryPromise = fetchSafe('https://servicodados.ibge.gov.br/api/v3/agregados/1685/periodos/-1/variaveis/2078?localidades=N6[N3[51]]');

        const [popRes, pibRes] = await Promise.all([popPromise, pibPromise]);

        // Helper extraction
        const extractMap = (res: any, variableId?: string) => {
            const map: Record<string, number> = {};
            if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
                 res.data.forEach((variableGroup: any) => {
                     // Filter by variable ID if provided (for combined requests like CEMPRE)
                     if (variableId && variableGroup.id != variableId) return;

                     const series = variableGroup.resultados[0]?.series;
                     if (series && Array.isArray(series)) {
                        series.forEach((item: any) => {
                            const cityId = item.localidade.id;
                            const periods = Object.keys(item.serie);
                            const lastPeriod = periods[periods.length - 1];
                            const value = item.serie[lastPeriod]; 
                            if (value && value !== '...' && value !== '-') {
                                map[cityId] = parseFloat(value as string);
                            }
                        });
                     }
                 });
            }
            return map;
        };

        const popMap = extractMap(popRes);
        const pibMap = extractMap(pibRes);
        const jobsMap = {}; // extractMap(jobsRes);
        const salaryMap = {}; // extractMap(salaryRes);

        console.log("💾 Atualizando banco de dados...");
        
        let updatedCount = 0;
        let createdCount = 0;

        for (const city of cityList) {
            const idStr = city.id.toString();
            const pop = popMap[idStr] || 0;
            const totalGdpMilReais = pibMap[idStr] || 0;
            const jobs = jobsMap[idStr] || 0;
            const salaryMW = salaryMap[idStr] || 0;

            // Calculate Per Capita GDP (Reais)
            const gdpPerCapitaReais = (pop > 0 && totalGdpMilReais > 0) ? (totalGdpMilReais * 1000) / pop : 0;

            // Use monthly per capita GDP as proxy for average income
            const averageIncome = gdpPerCapitaReais > 0 ? (gdpPerCapitaReais / 12) : 0;
            
            const averageFormalSalary = salaryMW > 0 ? salaryMW * 1412 : 0;
            const population15to44 = Math.round(pop * 0.44); // Fallback estimate

            // Check if city exists to preserve some fields
            const existing = await prisma.city.findUnique({ where: { id: city.id } });

            const dataToUpdate = {
                name: city.nome,
                mesorregion: mapMesorregion(city.microrregiao?.mesorregiao?.nome || ''),
                population: pop > 0 ? pop : existing?.population || 0,
                population15to44: pop > 0 ? population15to44 : existing?.population15to44 || 0,
                averageIncome: averageIncome > 0 ? averageIncome : existing?.averageIncome || 0,
                averageFormalSalary: averageFormalSalary > 0 ? averageFormalSalary : existing?.averageFormalSalary || 0,
                formalJobs: jobs > 0 ? jobs : existing?.formalJobs || 0,
                // Keep existing values or defaults
                urbanizationIndex: existing?.urbanizationIndex || 0.75,
                // state removed as it is not in schema
                status: existing?.status || PrismaCityStatus.NOT_SERVED,
                gentilic: existing?.gentilic || 'matogrossense',
                anniversary: existing?.anniversary || '01/01',
                mayor: existing?.mayor || 'Não informado',
                urbanizedAreaKm2: existing?.urbanizedAreaKm2 || 10,
                updatedAt: new Date()
            };

            if (existing) {
                await prisma.city.update({
                    where: { id: city.id },
                    data: dataToUpdate
                });
                updatedCount++;
            } else {
                await prisma.city.create({
                    data: {
                        id: city.id,
                        ...dataToUpdate,
                        // state removed
                    }
                });
                createdCount++;
            }
            if ((updatedCount + createdCount) % 20 === 0) process.stdout.write(".");
        }

        console.log(`\n\n✅ Sincronização concluída!`);
        console.log(`📊 Atualizados: ${updatedCount}`);
        console.log(`➕ Criados: ${createdCount}`);

    } catch (e) {
        console.error("❌ Erro fatal:", e);
    } finally {
        await prisma.$disconnect();
    }
}

// Correction: Check schema for 'state' field. 
// Based on populate-internal.ts, it uses `state: city.state` in upsert.
// But schema.prisma provided earlier (lines 1-50, 51-100) showed `model City` WITHOUT `state` field.
// `backend/populate-internal.ts` imports from `../services/internalData.js` which has `state`.
// Let's re-verify schema.prisma content just to be sure. 
// Line 27: `model City {`
// Line 28: `id Int @id`
// Line 29: `name String`
// ... 
// There is NO `state` field in the shown schema.
// However `populate-internal.ts` tries to update `state`.
// This implies either `populate-internal.ts` is failing silently on that field or using a mismatched type, OR I missed the field.
// But Prisma Client usually throws if we pass unknown fields.
// I'll skip 'state' in my script to be safe, assuming only Mato Grosso (MT) is relevant and implied.

main();

async function main() {
    await fetchInitialData();
}
