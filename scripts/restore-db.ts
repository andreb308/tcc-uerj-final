import { prisma } from '../lib/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  let filepath = process.argv[2];
  
  if (!filepath) {
    // Look for the latest backup file in the workspace directory
    try {
      const files = await fs.readdir(process.cwd());
      const backups = files
        .filter((f) => f.startsWith('db_backup_') && f.endsWith('.json'))
        .sort(); // Sorting alphabetically sorts by ISO timestamp string
      
      if (backups.length === 0) {
        console.error('Error: No backup file specified and no db_backup_*.json files found in the workspace.');
        process.exit(1);
      }
      
      const latestBackup = backups[backups.length - 1];
      filepath = path.join(process.cwd(), latestBackup);
      console.log(`No backup file specified. Using the latest backup found: ${latestBackup}`);
    } catch (err) {
      console.error('Error scanning for backup files:', err);
      process.exit(1);
    }
  } else {
    filepath = path.resolve(process.cwd(), filepath);
  }

  console.log(`Starting database restore from: ${path.basename(filepath)}...`);

  try {
    const rawData = await fs.readFile(filepath, 'utf-8');
    const reports = JSON.parse(rawData);

    if (!Array.isArray(reports)) {
      throw new Error('Backup data is not a valid JSON array.');
    }

    console.log(`Loaded ${reports.length} records from backup.`);

    // Clear existing records to prevent unique constraints or duplication issues
    console.log('Clearing existing reports from database...');
    const deleteResult = await prisma.report.deleteMany({});
    console.log(`Cleared ${deleteResult.count} existing records.`);

    console.log('Restoring records to database...');
    
    // Using transaction or loop to insert records with explicit createdAt dates
    // since prisma createMany doesn't always support date overrides on all db engines,
    // looping is extremely safe and reliable for dev datasets.
    let successCount = 0;
    for (const report of reports) {
      await prisma.report.create({
        data: {
          id: report.id,
          status: report.status,
          artist: report.artist,
          trackTitle: report.trackTitle,
          targetLanguage: report.targetLanguage,
          artifactData: report.artifactData,
          albumCover: report.albumCover || undefined,
          reportData: report.reportData || undefined,
          chatHistory: report.chatHistory || undefined,
          createdAt: new Date(report.createdAt),
        },
      });
      successCount++;
    }

    console.log(`Success! Restored ${successCount} records to the database.`);
  } catch (error) {
    console.error('Error restoring database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
