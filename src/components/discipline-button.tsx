import { discipletype, DISCIPLINE_ICONS } from '@/lib/disciplines';

const DisciplineButton = ({
  active,
  onTabClick,
  d,
}: {
  active: boolean;
  onTabClick: (d: discipletype) => void;
  d: discipletype;
}) => {
  const Icon = DISCIPLINE_ICONS[d];
  const key = d.replaceAll(' ', '_').toLowerCase();

  return (
    <button
      onClick={() => onTabClick(d)}
      className={`blob ${active ? 'default' : key} shrink-0 p-4 px-3 duration-400 ease-out-soft text-sm transition-all flex items-center justify-center gap-2 bg-[#f4ede4]/0 cursor-pointer border ${
        active
          ? 'bg-primary text-black'
          : 'border-foreground/10 text-foreground/70 hover:border-foreground/30 hover:text-foreground'
      }`}
    >
      {Icon && (
        <span>
          <Icon size={22} strokeWidth={1.75} />
        </span>
      )}
      <span>{d}</span>
    </button>
  );
};

export default DisciplineButton;
