import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WorkCard } from '@/components/work-card';
import hero from '@/assets/hero-interior.jpg';
import { formatCount } from '@/lib/format-count';
import DisciplineButton from '@/components/discipline-button';
import { getHomePageData } from '../api/endpoints/home';
import { useWorks } from '@/api/hooks/work/useWorks';
import { DisplayWork } from '@/api/types/work';
import { ALL_DISCIPLINES, discipletype } from '@/lib/disciplines';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Atelier — Portfolios, Projects & Jobs for Spatial Creatives' },
      {
        name: 'description',
        content:
          'Atelier is where architects, interior designers, event organisers, civil engineers, artists and makers publish portfolios, post case studies, and meet clients.',
      },
    ],
  }),
  component: HomePage,
  loader: () => getHomePageData(),
});

function HomePage() {
  const { metrics, heroWork } = Route.useLoaderData();
  const [active, setActive] = useState<discipletype>('All');
  const { data: works = [] } = useWorks({
    category: active,
    order: { by: 'likes_count' },
  });

  const heroAuthorName = heroWork?.author?.full_name ?? heroWork?.author?.username;
  const heroInitials = (heroAuthorName ?? 'MO')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <section className="relative overflow-hidden rount">
        <div className="mx-auto max-w-350 px-5 lg:px-10 pt-12 lg:pt-20 pb-16 grid gap-8 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> A new home for spatial creatives
            </p>
            <h1 className="display-xl mt-5">
              Show the work.
              <br />
              <span className="italic font-light">Find</span> the work.
            </h1>
            <p className="mt-6 text-lg text-foreground/70 max-w-xl leading-relaxed">
              Atelier is where architects, interior designers, event organisers, civil engineers,
              artists & makers publish portfolios, post case studies, and meet clients.
            </p>
            <div className="mt-8 flex fFlex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" curve={'custom-l'}>
                  Join Atelier <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" variant="outline">
                  Explore work
                </Button>
              </Link>
            </div>
            {metrics && (
              <div className="mt-10 flex items-center gap-6 text-xs text-foreground/50">
                <div>
                  <div className="font-display text-2xl text-foreground">
                    {formatCount(metrics.creatives)}
                  </div>
                  <div>Creatives</div>
                </div>
                <div className="h-8 w-px bg-foreground/10" />
                <div>
                  <div className="font-display text-2xl text-foreground">
                    {formatCount(metrics.projects)}
                  </div>
                  <div>Projects published</div>
                </div>
                <div className="h-8 w-px bg-foreground/10" />
                <div>
                  <div className="font-display text-2xl text-foreground">
                    {formatCount(metrics.likes)}
                  </div>
                  <div>Total likes</div>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-5">
            {heroWork ? (
              <Link
                to="/works/$workId"
                params={{ workId: heroWork.id }}
                className="block relative rounded-3xl overflow-hidden shadow-(--shadow-lift) group"
              >
                <img
                  src={heroWork.cover_url}
                  alt={heroWork.title}
                  width={1600}
                  height={1200}
                  className="w-full h-115 lg:h-140 object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-background/90 backdrop-blur px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-8 w-8 rounded-full bg-foreground text-background grid place-items-center text-xs font-medium overflow-hidden shrink-0">
                      {heroWork.author?.avatar_url ? (
                        <img
                          src={heroWork.author.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        heroInitials
                      )}
                    </span>
                    <div className="leading-tight min-w-0">
                      <div className="text-sm font-medium truncate">{heroAuthorName}</div>
                      <div className="text-xs text-foreground/50 truncate">{heroWork.title}</div>
                    </div>
                  </div>
                  <span className="lime-pill">{heroWork.is_featured ? 'FEATURED' : 'LATEST'}</span>
                </div>
              </Link>
            ) : (
              <div className="relative rounded-3xl overflow-hidden shadow-(--shadow-lift)">
                <img
                  src={hero}
                  alt="Sun-drenched modern interior"
                  width={1600}
                  height={1200}
                  className="w-full h-115 lg:h-140 object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DISCIPLINES — active filter */}
      <section className="border-y border-foreground/5 bg-background/60">
        <div className="mx-auto max-w-350 px-5 lg:px-10 py-5 flex gap-2 overflow-x-auto scrollbar-none lg:flex-wrap">
          {ALL_DISCIPLINES.map(d => {
            const active_ = d === active;
            return (
              <DisciplineButton
                key={d}
                onTabClick={d => setActive(prev => (prev === d ? 'All' : d))}
                d={d}
                active={active_}
              />
            );
          })}
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-350 px-5 lg:px-10 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow">Popular this week</p>
            <h2 className="display-lg mt-2">{active === 'All' ? 'Featured shots' : active}</h2>
          </div>
          <Link
            to="/explore"
            search={{ discipline: active }}
            className="text-sm hover:underline hidden sm:inline-flex items-center gap-1"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {works.map(w => (
            <WorkCard key={w.id} work={w as DisplayWork} />
          ))}
        </div>
        {active !== 'All' && works.length === 0 && (
          <p className="text-center text-foreground/50 py-12">
            No published work in {active} yet.{' '}
            <Link to="/search" search={{ discipline: active } as any} className="underline">
              Browse all creatives
            </Link>
            .
          </p>
        )}
      </section>

      <section className="mx-auto max-w-350 px-5 lg:px-10 pb-8">
        <div className="rounded-3xl bg-foreground text-background px-8 lg:px-16 py-16 lg:py-20 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <span className="lime-pill">PRO</span>
            <h2 className="display-lg mt-5 text-background">
              Get seen first.
              <br />
              Get hired faster.
            </h2>
            <p className="mt-5 text-background/70 max-w-md leading-relaxed">
              Land in the top ten of every search. First access to job requests. Faster updates,
              deeper analytics, priority on the homepage.
            </p>
            <Button size="lg" className="mt-8" asChild curve={'custom-r'}>
              <Link to="/pricing" search={{ reference: 'pricing', trxref: 'price' }}>
                Upgrade to Pro
              </Link>
            </Button>
          </div>
          <ul className="space-y-4 text-background/85">
            {[
              'Top 10 placement in search results',
              'First access to new job requests',
              'Featured profile badge & cover banner',
              'Detailed visitor & engagement analytics',
              'Priority booking inquiries',
            ].map(b => (
              <li key={b} className="flex items-center gap-3">
                <span className="h-0.75 rounded-3xl w-6 bg-primary shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
