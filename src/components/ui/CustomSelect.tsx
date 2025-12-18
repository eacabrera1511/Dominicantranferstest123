import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export function CustomSelect({ value, onChange, options, placeholder = 'Select...' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
        style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)'
        }}
      >
        <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
          style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          <div className="p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex flex-col px-3 py-2.5 text-left rounded-xl transition-all duration-150 active:scale-[0.98] hover:bg-white/10 ${
                  option.value === value ? 'bg-white/10' : ''
                }`}
              >
                <span className="font-medium text-[13px] text-white">{option.label}</span>
                {option.description && (
                  <span className="text-[11px] text-gray-400 -mt-0.5">{option.description}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
