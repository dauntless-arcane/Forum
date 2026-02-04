interface TagChipProps {
  tag: string;
  onClick?: () => void;
  active?: boolean;
}

export default function TagChip({ tag, onClick, active = false }: TagChipProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-soft text-white'
          : 'bg-soft/20 text-soft dark:bg-soft/30 dark:text-soft'
      } ${onClick ? 'cursor-pointer hover:bg-soft/30 dark:hover:bg-soft/40' : ''}`}
    >
      {tag}
    </span>
  );
}
