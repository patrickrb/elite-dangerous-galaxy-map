import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Define types for system data
interface RawSystemData {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  population?: number | null;
  primary_economy?: string | null;
  allegiance?: string | null;
  government?: string | null;
  faction?: string | null;
  state?: string | null;
  security?: string | null;
  power?: string | null;
  power_state?: string | null;
  needs_permit?: number;
  updated_at?: number;
  simbad_ref?: string | null;
}

interface SystemData {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  population: number;
  primary_economy: string;
  allegiance: string;
  government: string;
}

// Cache for systems data to avoid reading file on every request
let cachedSystems: SystemData[] | null = null;

function loadSystemsData(): SystemData[] {
  if (cachedSystems) {
    return cachedSystems;
  }
  
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'systems.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const allSystems: RawSystemData[] = JSON.parse(fileContents);
    
    // For performance, we'll take every 100th system to get about 1000 systems
    // This gives us a good sampling across the galaxy while keeping performance reasonable
    const sampledSystems = allSystems.filter((_: RawSystemData, index: number) => index % 100 === 0);
    
    // Transform the data to match our expected format
    cachedSystems = sampledSystems.map((system: RawSystemData): SystemData => ({
      id: system.id,
      name: system.name,
      x: system.x,
      y: system.y,
      z: system.z,
      population: system.population || 0,
      primary_economy: system.primary_economy || 'None',
      allegiance: system.allegiance || 'None',
      government: system.government || 'None'
    }));
    
    return cachedSystems;
  } catch (error) {
    console.error('Error loading systems data:', error);
    // Fallback to empty array if file cannot be read
    return [];
  }
}

export async function GET() {
  try {
    // Load systems from the actual Elite Dangerous systems.json file
    const systems = loadSystemsData();
    return NextResponse.json(systems);
  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
  }
}