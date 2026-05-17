import "dotenv/config";
import { prisma } from "../lib/prisma";

async function testDatabase() {
  console.log("🔍 Testing Prisma database connection...\n");

  try {
    // Test 1: Check connection
    console.log("✅ Connected to database!");

    // Test 2: Create a test report
    console.log("\n📝 Creating a test report...");
    const newReport = await prisma.report.create({
      data: {
        artist: "Test Artist",
        trackTitle: "Test Track",
        targetLanguage: "en",
        artifactData: "{}",
      },
    });
    console.log("✅ Created report:", newReport);

    // Test 3: Fetch all reports
    console.log("\n📋 Fetching all reports...");
    const allReports = await prisma.report.findMany();
    console.log(`✅ Found ${allReports.length} report(s):`);
    allReports.forEach((report) => {
      console.log(`   - ${report.id} (${report.artist} - ${report.trackTitle})`);
    });

    // Test 4: Delete the test report
    console.log("\n🧹 Cleaning up test report...");
    await prisma.report.delete({
      where: { id: newReport.id }
    });
    console.log("✅ Cleanup successful.");

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    // Important to disconnect from database when testing script ends
    await prisma.$disconnect();
  }
}

testDatabase();
