import { NextResponse } from 'next/server';

// Generate realistic galactic coordinates similar to Elite Dangerous galaxy
function generateGalacticCoordinates() {
  // Generate coordinates that follow a more realistic galactic distribution
  // Most systems are concentrated near the galactic center with some scattered throughout
  
  const random = Math.random();
  
  if (random < 0.6) {
    // 60% of systems in the core bubble (similar to inhabited space in Elite)
    return {
      x: (Math.random() - 0.5) * 400 + (Math.random() - 0.5) * 50, // -225 to 225 with center bias
      y: (Math.random() - 0.5) * 200 + (Math.random() - 0.5) * 30, // -115 to 115 with center bias  
      z: (Math.random() - 0.5) * 300 + (Math.random() - 0.5) * 40  // -170 to 170 with center bias
    };
  } else if (random < 0.85) {
    // 25% in the extended region (further from center)
    return {
      x: (Math.random() - 0.5) * 2000,  // -1000 to 1000
      y: (Math.random() - 0.5) * 1000,  // -500 to 500
      z: (Math.random() - 0.5) * 1500   // -750 to 750
    };
  } else {
    // 15% in the far reaches (matching some of the extreme coordinates from legacy data)
    const angle = Math.random() * Math.PI * 2;
    const distance = 1000 + Math.random() * 8000; // 1000 to 9000 light years from center
    return {
      x: Math.cos(angle) * distance + (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 3000, // -1500 to 1500 
      z: Math.sin(angle) * distance + (Math.random() - 0.5) * 30000 // Allow for some very distant systems
    };
  }
}

// Mock data for now - in production this would come from MongoDB
const mockSystems = Array.from({ length: 1000 }, (_, i) => {
  const coords = generateGalacticCoordinates();
  return {
    id: i,
    name: `System ${i}`,
    x: coords.x,
    y: coords.y,
    z: coords.z,
    population: Math.floor(Math.random() * 1000000000),
    primary_economy: ['Industrial', 'Agriculture', 'Extraction', 'Refinery', 'Service', 'Tourism', 'Military', 'High Tech'][Math.floor(Math.random() * 8)],
    allegiance: ['Federation', 'Empire', 'Alliance', 'Independent', 'Thargoid', 'Guardian'][Math.floor(Math.random() * 6)],
    government: ['Democracy', 'Corporate', 'Dictatorship', 'Communist', 'Feudal', 'Cooperative', 'Confederacy', 'Patronage'][Math.floor(Math.random() * 8)]
  };
});

export async function GET() {
  try {
    // In a real app, this would query the database
    return NextResponse.json(mockSystems);
  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
  }
}