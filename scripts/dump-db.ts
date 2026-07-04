import { prisma } from '../lib/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  console.log('Starting database dump...');
  
  try {
    const reports = await prisma.$queryRawUnsafe('SELECT * FROM reports') as any[];
    
    console.log(`Retrieved ${reports.length} records from the database.`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db_backup_${timestamp}.json`;
    const filepath = path.join(process.cwd(), filename);
    
    const data = JSON.stringify(reports, null, 2);
    await fs.writeFile(filepath, data, 'utf-8');
    
    console.log(`Success! Database dumped to: ${filename}`);
  } catch (error) {
    console.error('Error dumping database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
