import { Sparkles } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6 animate-slideIn">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles className="w-4 h-4 text-teal-500 dark:text-teal-400" />
        <span className="text-slate-500 dark:text-gray-400 text-sm font-medium">Suggestions</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="group relative px-5 py-3 rounded-2xl text-[14px] font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden
              bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-600
              dark:from-teal-500 dark:via-cyan-500 dark:to-emerald-500
              backdrop-blur-xl
              border border-teal-400/30 dark:border-teal-300/30
              text-white
              shadow-[0_4px_24px_-4px_rgba(20,184,166,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)]
              hover:shadow-[0_8px_32px_-4px_rgba(20,184,166,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)]
              hover:border-teal-300/50 dark:hover:border-teal-200/50
              hover:bg-gradient-to-br hover:from-teal-500 hover:via-cyan-500 hover:to-emerald-500
              dark:hover:from-teal-400 dark:hover:via-cyan-400 dark:hover:to-emerald-400"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
