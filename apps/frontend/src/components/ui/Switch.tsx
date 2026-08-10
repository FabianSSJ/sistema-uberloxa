interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = {
  sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
};

export const Switch = ({ checked, onChange, label, size = 'md', className = '' }: SwitchProps) => {
  const s = SIZES[size];

  return (
    // <button> en vez de <div>+onKeyDown: Enter/Espacio activan el click nativamente,
    // sin tener que reimplementar el manejo de teclado a mano.
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`flex items-center gap-2 cursor-pointer select-none ${className}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      {label && <span className="text-sm font-semibold text-gray-700">{label}</span>}
      <span
        className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${s.track} ${
          checked ? 'bg-amber-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${s.thumb} ${
            checked ? s.translate : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
};
