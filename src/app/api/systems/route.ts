import { NextResponse } from 'next/server';

// Mock data for now - in production this would come from MongoDB
const mockSystems = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `System ${i}`,
  x: (Math.random() - 0.5) * 100,
  y: (Math.random() - 0.5) * 100,
  z: (Math.random() - 0.5) * 100,
  population: Math.floor(Math.random() * 1000000000),
  primary_economy: ['Industrial', 'Agriculture', 'Extraction', 'Refinery', 'Service', 'Tourism', 'Military', 'High Tech'][Math.floor(Math.random() * 8)],
  allegiance: ['Federation', 'Empire', 'Alliance', 'Independent', 'Thargoid', 'Guardian'][Math.floor(Math.random() * 6)],
  government: ['Democracy', 'Corporate', 'Dictatorship', 'Communist', 'Feudal', 'Cooperative', 'Confederacy', 'Patronage'][Math.floor(Math.random() * 8)]
}));

export async function GET() {
  try {
    // In a real app, this would query the database
    return NextResponse.json(mockSystems);
  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
  }
}