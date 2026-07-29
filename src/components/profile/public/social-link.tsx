import { Instagram, Linkedin, Twitter } from 'lucide-react';

function socialUrl(kind: 'instagram' | 'behance' | 'dribbble' | 'linkedin' | 'twitter', v: string) {
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').trim();
  switch (kind) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'behance':
      return `https://behance.net/${handle}`;
    case 'dribbble':
      return `https://dribbble.com/${handle}`;
    case 'linkedin':
      return `https://linkedin.com/in/${handle}`;
    case 'twitter':
      return `https://x.com/${handle}`;
  }
}

export function SocialLinks({ profile }: { profile: Profile }) {
  const items: {
    kind: 'instagram' | 'behance' | 'dribbble' | 'linkedin' | 'twitter';
    v: string | null;
    icon: React.ReactNode;
    label: string;
  }[] = [
    {
      kind: 'instagram',
      v: profile.instagram,
      icon: <Instagram className="h-4 w-4" />,
      label: 'Instagram',
    },
    {
      kind: 'behance',
      v: profile.behance,
      icon: <span className="font-display text-[11px] font-bold">Bē</span>,
      label: 'Behance',
    },
    {
      kind: 'dribbble',
      v: profile.dribbble,
      icon: <span className="font-display text-[11px] font-bold">Dr</span>,
      label: 'Dribbble',
    },
    {
      kind: 'linkedin',
      v: profile.linkedin,
      icon: <Linkedin className="h-4 w-4" />,
      label: 'LinkedIn',
    },
    { kind: 'twitter', v: profile.twitter, icon: <Twitter className="h-4 w-4" />, label: 'X' },
  ].filter(i => i.v && i.v.trim()) as any;
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map(i => (
        <a
          key={i.kind}
          href={socialUrl(i.kind, i.v!)}
          target="_blank"
          rel="noreferrer"
          aria-label={i.label}
          className="h-9 w-9 grid place-items-center rounded-full border border-foreground/15 text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          {i.icon}
        </a>
      ))}
    </div>
  );
}
