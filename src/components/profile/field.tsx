export function Field({
  label,
  children,
  className,
  error,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <div className="flex items-baseline justify-between">
        <span className="block text-xs font-medium uppercase tracking-wider text-foreground/55 mb-2">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </span>
        {hint && !error && <span className="text-xs text-foreground/35">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </label>
  );
}
