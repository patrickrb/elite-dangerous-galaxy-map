import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Load systems from the actual systems.json file
    const filePath = path.join(process.cwd(), 'public', 'systems.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const systemsData = JSON.parse(fileContents);
    
    return NextResponse.json(systemsData);
  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
  }
}