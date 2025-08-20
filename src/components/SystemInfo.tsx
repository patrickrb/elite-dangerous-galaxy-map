interface System {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  population?: number;
  primary_economy?: string;
  allegiance?: string;
  government?: string;
}

interface Station {
  id: number;
  name: string;
  system_id: number;
  type: string;
}

interface SystemInfoProps {
  system: System;
  stations: Station[];
  onClose: () => void;
}

export function SystemInfo({ system, stations, onClose }: SystemInfoProps) {
  const formatPopulation = (pop?: number) => {
    if (!pop) return 'Unknown';
    if (pop >= 1e9) return `${(pop / 1e9).toFixed(1)}B`;
    if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)}M`;
    if (pop >= 1e3) return `${(pop / 1e3).toFixed(1)}K`;
    return pop.toString();
  };

  return (
    <div className="system-info">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{system.name}</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3 text-sm text-gray-300">
        <div>
          <span className="text-gray-400">Position:</span>
          <div className="text-white">
            X: {system.x.toFixed(2)} | Y: {system.y.toFixed(2)} | Z: {system.z.toFixed(2)}
          </div>
        </div>
        
        {system.population && (
          <div>
            <span className="text-gray-400">Population:</span>
            <span className="text-white ml-2">{formatPopulation(system.population)}</span>
          </div>
        )}
        
        {system.primary_economy && (
          <div>
            <span className="text-gray-400">Economy:</span>
            <span className="text-white ml-2">{system.primary_economy}</span>
          </div>
        )}
        
        {system.allegiance && (
          <div>
            <span className="text-gray-400">Allegiance:</span>
            <span className="text-white ml-2">{system.allegiance}</span>
          </div>
        )}
        
        {system.government && (
          <div>
            <span className="text-gray-400">Government:</span>
            <span className="text-white ml-2">{system.government}</span>
          </div>
        )}
        
        {stations.length > 0 && (
          <div>
            <span className="text-gray-400">Stations ({stations.length}):</span>
            <div className="mt-2 space-y-1">
              {stations.slice(0, 5).map((station) => (
                <div key={station.id} className="text-white text-xs">
                  • {station.name} ({station.type})
                </div>
              ))}
              {stations.length > 5 && (
                <div className="text-gray-400 text-xs">
                  +{stations.length - 5} more...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}