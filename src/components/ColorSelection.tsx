interface ColorSelectionProps {
  onClose: () => void;
  onColorChange: (colorType: string) => void;
}

export function ColorSelection({ onClose, onColorChange }: ColorSelectionProps) {
  const colorTypes = [
    { key: 'economy', label: 'Economy' },
    { key: 'allegiance', label: 'Allegiance' },
    { key: 'government', label: 'Government' }
  ];

  return (
    <div className="color-selection">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Color By</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        {colorTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => onColorChange(type.key)}
            className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}