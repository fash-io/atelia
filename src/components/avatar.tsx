export function Avatar({
  p,
  size = 'size-6.5',
}: {
  p: { full_name?: string | null; username?: string | null; avatar_url?: string | null } | null;
  size?: string;
}) {
  if (!p) return <span className={`${size} rounded-full bg-foreground/20 shrink-0`} />;

  const initials = () =>
    (p.full_name ?? p.username ?? 'A')
      .split(' ')
      .map(x => x[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <span
      className={`${size} rounded-full bg-foreground text-background grid place-items-center font-medium shrink-0 overflow-hidden`}
    >
      {p.avatar_url ? (
        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        initials()
      )}
    </span>
  );
}
