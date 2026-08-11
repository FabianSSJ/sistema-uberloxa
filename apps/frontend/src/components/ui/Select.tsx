import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, Plus } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  /** Texto extra para la búsqueda (no se muestra). Permite buscar por campos que no están en el label. */
  searchText?: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  fullWidth?: boolean;
  searchable?: boolean;
  onAddNew?: (term: string) => void;
  addNewLabel?: string;
  isAddingNew?: boolean;
}

export const normalizeString = (str?: string | null): string => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  error,
  fullWidth = true,
  searchable = false,
  onAddNew,
  addNewLabel = 'Crear',
  isAddingNew = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50); // slight delay to allow rendering animation
    }
  }, [isOpen, searchable]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    const term = normalizeString(searchTerm);
    return options.filter(opt =>
      normalizeString(opt.label).includes(term) ||
      String(opt.value).toLowerCase().includes(term) ||
      (opt.searchText ? normalizeString(opt.searchText).includes(term) : false)
    );
  }, [options, searchable, searchTerm]);

  const exactMatchExists = useMemo(() => {
    if (!searchTerm.trim()) return true;
    const term = normalizeString(searchTerm);
    return options.some(opt => normalizeString(opt.label) === term);
  }, [options, searchTerm]);

  const widthClass = fullWidth ? 'w-full' : '';
  const errorClass = error 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 hover:border-gray-400';

  return (
    <div className={`flex flex-col gap-1.5 ${widthClass} relative`} ref={containerRef}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 bg-white border rounded-md text-[0.9375rem] cursor-pointer transition-colors duration-200 outline-none ${errorClass} ${isOpen ? 'ring-2 ring-blue-500 border-blue-500 ring-opacity-50' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={selectedOption ? 'text-gray-800' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 flex flex-col overflow-hidden animate-[fadeIn_0.15s_ease-out]">
          
          {searchable && (
            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchable && searchTerm ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
              </div>
            ) : (
              <ul className="py-1 m-0 list-none">
                {filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    className={`px-4 py-2.5 text-[0.9375rem] flex items-center justify-between transition-colors
                      ${option.disabled
                        ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400'
                        : option.value === value 
                          ? 'bg-blue-50 text-blue-700 font-medium cursor-pointer' 
                          : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                      }`}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    {option.label}
                    {option.value === value && <Check size={16} className="text-blue-600" />}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botón rápido para agregar nueva opción si no existe coincidencia exacta */}
          {onAddNew && searchTerm.trim() && !exactMatchExists && (
            <div
              className="p-2.5 border-t border-blue-100 bg-blue-50 hover:bg-blue-100/90 transition-colors cursor-pointer flex items-center justify-between text-blue-700 font-semibold text-sm"
              onClick={(e) => {
                e.stopPropagation();
                const termToCreate = searchTerm.trim();
                onAddNew(termToCreate);
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              <span className="flex items-center gap-2 truncate">
                <Plus size={16} className="shrink-0 text-blue-600" />
                <span className="truncate">{addNewLabel} "{searchTerm.trim()}"</span>
              </span>
              {isAddingNew && <span className="animate-spin text-xs">⏳</span>}
            </div>
          )}
        </div>
      )}

      {error && (
        <span className="text-sm text-red-500 mt-0.5">{error}</span>
      )}
    </div>
  );
};
