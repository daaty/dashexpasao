import { savePlanDetails, getPlanDetails, deletePlanDetails } from '../src/controllers/planDetails.controller';
import { PrismaClient } from '@prisma/client';

// Minimal mock Request/Response
class MockResponse {
  statusCode: number = 200;
  body: any = null;
  status(code: number) { this.statusCode = code; return this; }
  json(obj: any) { this.body = obj; return this; }
}

async function run() {
  const prisma = new PrismaClient();
  try {
    const cityId = 9999;
    const reqPost: any = { params: { cityId: String(cityId) }, body: { phases: [{ name: 'Test Phase', tasks: [] }], startDate: '2026-04-01' } };
    const resPost = new MockResponse();
    await savePlanDetails(reqPost, resPost as any);
    console.log('Controller POST response:', resPost.statusCode, JSON.stringify(resPost.body, null, 2));

    const reqGet: any = { params: { cityId: String(cityId) } };
    const resGet = new MockResponse();
    await getPlanDetails(reqGet, resGet as any);
    console.log('Controller GET response:', resGet.statusCode, JSON.stringify(resGet.body, null, 2));

    const reqDel: any = { params: { cityId: String(cityId) } };
    const resDel = new MockResponse();
    await deletePlanDetails(reqDel, resDel as any);
    console.log('Controller DELETE response:', resDel.statusCode, JSON.stringify(resDel.body, null, 2));

  } catch (err) {
    console.error('Error invoking controllers:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
