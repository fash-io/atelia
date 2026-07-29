import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Search as SearchIcon,
  MapPin,
  Sparkles,
  X,
  ArrowUpDown,
  Briefcase,
  Building2,
  PenTool,
  HardHat,
  Camera,
  Cog,
  Palette,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ACCOUNT_TYPE_DISCIPLINES,
  ALL_DISCIPLINES,
  discipletype,
  DISCIPLINE_ICONS,
} from '@/lib/disciplines';
import { useSearchUsers } from '@/api/hooks/search/useSearchUsers';
import { account_type } from '@/api/types/user';

export const Route = createFileRoute('/search')({
  head: () => ({
    meta: [
      { title: 'Find creatives — Atelier' },
      {
        name: 'description',
        content:
          'Search architects, interior designers, event organisers, civil engineers, artists and makers.',
      },
    ],
  }),
  component: SearchPage,
});

const ACCOUNT_TYPES = [
  { v: 'architect', label: 'Architect', icon: Building2 },
  { v: 'designer', label: 'Designer', icon: PenTool },
  { v: 'builder', label: 'Builder', icon: HardHat },
  { v: 'photographer', label: 'Photographer', icon: Camera },
  { v: 'engineer', label: 'Engineer', icon: Cog },
  { v: 'artist', label: 'Artist', icon: Palette },
  { v: 'studio', label: 'Studio', icon: Layers },
] as const;

const SORTS = [
  { v: 'is_pro', label: 'Pro first' },
  { v: 'created_at', label: 'Newest' },
  { v: 'full_name', label: 'A–Z' },
] as const;

function FilterBlob({
  active,
  icon: Icon,
  label,
  slug,
  onClick,
  activeClass,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  slug: string;
  onClick: () => void;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`blob ${slug} h-9 shrink-0 px-2.5 flex items-center gap-0 border transition-all overflow-hidden ${
        active
          ? activeClass
          : 'border-foreground/15 text-foreground/50 hover:border-foreground/40 hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-200 ${
          active ? 'max-w-32 ml-1.5' : 'max-w-0 ml-0'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function SearchPage() {
  const [q, setQ] = useState('');
  const [discipline, setDiscipline] = useState('All');
  const [accountType, setAccountType] = useState<account_type>('any');
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [hireOnly, setHireOnly] = useState(false);
  const [sortIndex, setSortIndex] = useState(0);
  const sort = SORTS[sortIndex].v;

  const { data: results = [] } = useSearchUsers({
    discipline,
    accountType,
    location,
    hireOnly,
    q,
    order: {
      by: sort,
      asc: sort === 'full_name' ? true : false,
    },
  });

  const clear = () => {
    setQ('');
    setDiscipline('All');
    setAccountType('any');
    setLocation('');
    setShowLocationInput(false);
    setHireOnly(false);
    setSortIndex(0);
  };

  const activeCount = [
    discipline !== 'All',
    accountType !== 'any',
    location.trim().length > 0,
    hireOnly,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <div>
        <p className="eyebrow">Find</p>
        <h1 className="display-lg mt-2">Find creatives</h1>
        <p className="mt-2 text-foreground/60">
          Discover architects, designers, builders, photographers and studios.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="relative w-full lg:w-56 shrink-0">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full h-10 pl-9 pr-8 rounded-full border border-foreground/10 bg-background text-sm focus:outline-none focus:border-foreground/40"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="h-5 w-px bg-foreground/10 shrink-0 hidden lg:block" />

        <div className="w-full lg:w-auto hidden lg:flex gap-1.5 overflow-x-auto scrollbar-none">
          {accountType !== 'any' && (
            <div className="w-full lg:w-auto flex gap-1.5 overflow-x-auto scrollbar-none mt-2 animate-menu-item">
              {(ACCOUNT_TYPE_DISCIPLINES[accountType]?.length
                ? ALL_DISCIPLINES.filter(d => ACCOUNT_TYPE_DISCIPLINES[accountType].includes(d))
                : ALL_DISCIPLINES
              ).map((d: discipletype) => {
                const active = d === discipline;
                const Icon = DISCIPLINE_ICONS[d];
                if (!Icon) return null;
                return (
                  <button
                    key={d}
                    onClick={() => setDiscipline(prev => (prev === d ? 'All' : d))}
                    className={`blob ${d.replaceAll(' ', '_').toLowerCase()} h-10 shrink-0 px-2.5 flex items-center gap-0 border transition-all overflow-hidden ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-foreground/15 text-foreground/70 hover:border-foreground/40'
                    }`}
                  >
                    <span>
                      <Icon size={17} strokeWidth={1.75} />
                    </span>
                    <span className="text-xs whitespace-nowrap ml-2">{d}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap max-lg:ml-auto">
          {ACCOUNT_TYPES.map(({ v, label, icon }) => (
            <FilterBlob
              key={v}
              active={v === accountType}
              icon={icon}
              label={label}
              slug={label.toLowerCase()}
              onClick={() => {
                setAccountType(v === accountType ? 'any' : v);
                setDiscipline('All');
              }}
              activeClass="bg-accent-foreground text-accent border-accent-foreground"
            />
          ))}
        </div>

        <div className="flex items-center gap-2 max-lg:ml-auto">
          {(() => {
            const expanded = showLocationInput;
            return (
              <div
                className={`relative h-9 rounded-full border transition-all duration-300 ease-out-soft overflow-hidden ${
                  expanded
                    ? 'w-40 border-foreground/15 bg-background'
                    : 'w-9 border-transparent bg-accent'
                }`}
              >
                <button
                  onClick={() => !expanded && setShowLocationInput(true)}
                  aria-label="Filter by location"
                  title="Filter by location"
                  className={`absolute left-0 top-0 h-9 w-9 grid place-items-center transition-all duration-300 ease-out-soft ${
                    expanded ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <MapPin
                    className={`h-4 w-4 transition-all duration-300 ease-out-soft ${
                      expanded
                        ? 'opacity-40 scale-75 -translate-x-1 text-foreground/40'
                        : 'opacity-100 scale-100 translate-x-0 text-accent-foreground'
                    }`}
                  />
                </button>

                <input
                  autoFocus={expanded}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onBlur={() => !location && setShowLocationInput(false)}
                  placeholder="City or region…"
                  tabIndex={expanded ? 0 : -1}
                  className={`h-9 pl-8 pr-8 rounded-full bg-transparent text-sm focus:outline-none w-full transition-opacity duration-300 ${
                    expanded ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'
                  }`}
                />

                {expanded && location && (
                  <button
                    onClick={() => {
                      setLocation('');
                      setShowLocationInput(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })()}

          <button
            onClick={() => setHireOnly(h => !h)}
            title="Available for hire"
            aria-label="Available for hire"
            aria-pressed={hireOnly}
            className={`h-9 shrink-0 px-2.5 flex items-center gap-0 border transition-all overflow-hidden rounded-full ${
              hireOnly
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground hover:brightness-95'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span
              className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-200 ${
                hireOnly ? 'max-w-32 ml-1.5' : 'max-w-0 ml-0'
              }`}
            >
              Available for hire
            </span>
          </button>

          <button
            onClick={() => setSortIndex(i => (i + 1) % SORTS.length)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs border border-foreground/15 text-foreground/70 hover:border-foreground/40 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> {SORTS[sortIndex].label}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 h-8">
        <p className="text-sm text-foreground/60">
          {`${results.length} creatives`}
          {activeCount > 0 && (
            <span className="ml-2 text-foreground/40">
              · {activeCount} filter{activeCount > 1 ? 's' : ''} active
            </span>
          )}
        </p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear all
          </Button>
        )}
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map(p => (
          <li key={p.id}>
            <Link
              to="/u/$username"
              params={{ username: p.username ?? '' }}
              className="block rounded-2xl border border-foreground/10 p-5 hover:border-foreground/40 hover:shadow-sm transition-all h-full"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-foreground text-background grid place-items-center font-display shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (p.full_name ?? p.username ?? 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{p.full_name ?? p.username}</span>
                    {p.is_pro && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-foreground/60">
                        <Sparkles className="h-3 w-3" />
                        Pro
                      </span>
                    )}
                    {p.available_for_hire && (
                      <span className="lime-pill" style={{ fontSize: 10 }}>
                        Available
                      </span>
                    )}
                  </div>
                  {p.headline && (
                    <p className="text-sm text-foreground/65 mt-1 line-clamp-2">{p.headline}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground/50">
                    {p.account_type && p.account_type !== 'other' && (
                      <span className="capitalize">{p.account_type}</span>
                    )}
                    {p.discipline && <span>{p.discipline}</span>}
                    {p.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {p.location}
                      </span>
                    )}
                  </div>
                  {p.skills?.length && p.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.skills.slice(0, 4).map(s => (
                        <span
                          key={s}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-foreground/5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {results.length === 0 && (
        <div className="text-center py-20 text-foreground/50">
          No creatives match these filters.
        </div>
      )}
    </div>
  );
}
