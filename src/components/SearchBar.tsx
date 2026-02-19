import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceTime?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search questions...',
  debounceTime = 500
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isTyping, setIsTyping] = useState(false);

  // Sync local value when prop changes (e.g. clear button from parent)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Use a ref for the callback to avoid re-running effect when the callback function identity changes
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    // Skip if values are same to avoid unnecessary updates/loops
    if (localValue === value) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const handler = setTimeout(() => {
      onChangeRef.current(localValue);
      setIsTyping(false);
    }, debounceTime);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, debounceTime]); // Explicitly removed 'value' to break potential loops, relying on local state driving the change

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  return (
    <div className="relative">
      <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 ${isTyping ? 'opacity-0' : 'opacity-100'} transition-opacity`} size={20} />
      <Loader2 className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin ${isTyping ? 'opacity-100' : 'opacity-0'} transition-opacity`} size={20} />

      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-beige/30 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-shadow"
      />
    </div>
  );
}
