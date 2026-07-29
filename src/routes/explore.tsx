import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { WorkCard } from '@/components/work-card';
import DisciplineButton from '@/components/discipline-button';
import { useWorks } from '@/api/hooks/work/useWorks';
import { DisplayWork } from '@/api/types/work';
import { ALL_DISCIPLINES, discipletype } from '@/lib/disciplines';

type ExploreSearch = {
  discipline?: discipletype;
};

export const Route = createFileRoute('/explore')({
  head: () => ({
    meta: [
      { title: 'Explore — Atelier' },
      {
        name: 'description',
        content:
          'Browse architecture, interior design, event design, civil engineering, art and craft from creatives around the world.',
      },
    ],
  }),
  component: ExplorePage,
  validateSearch: (search: Record<string, unknown>): ExploreSearch => {
    const discipline = ALL_DISCIPLINES.includes(search.discipline as any)
      ? (search.discipline as discipletype)
      : ('All' as discipletype);
    return {
      discipline,
    };
  },
});

function ExplorePage() {
  const [q, setQ] = useState('');
  const { discipline } = Route.useSearch();
  const [active, setActive] = useState(discipline ?? 'All');

  const handleChange = (d: discipletype) => {
    setActive(prev => (prev === d ? 'All' : d));
  };

  const { data = [] } = useWorks({ category: active, search: q });

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <p className="eyebrow">Discover</p>
          <h1 className="display-lg mt-2">Explore the work</h1>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search creatives, projects, disciplines…"
            className="w-full h-12 pl-11 pr-4 rounded-full border border-foreground/10 bg-background text-sm focus:outline-none focus:border-foreground/40"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none lg:flex-wrap">
        {ALL_DISCIPLINES.map(d => (
          <DisciplineButton active={active === d} d={d} onTabClick={handleChange} key={d} />
        ))}
      </div>

      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map(w => (
          <WorkCard key={w.id} work={w as DisplayWork} />
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-24 text-foreground/50">No work matches that search yet.</div>
      )}
    </div>
  );
}
