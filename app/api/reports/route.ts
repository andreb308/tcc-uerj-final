import { NextResponse } from 'next/server';
import { getAllReports } from '@/lib/report-store';

export async function GET() {
  const reports = getAllReports();
  // Sort reports by creation date, descending (newest first)
  // const sortedReports = reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return NextResponse.json(reports);
}
