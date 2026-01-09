interface ResurfacingCardProps {
  title: string;
  description: string;
  highlight?: string | null;
  items?: string[];
  dateLabel?: string | null;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onClick?: () => void;
}

const ResurfacingCard = ({
  title,
  description,
  highlight,
  items,
  dateLabel,
  loading,
  isSignedIn,
  error,
  onClick
}: ResurfacingCardProps) => {
  const isInteractive = Boolean(onClick);
  return (
    <div
      className={`rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-5 text-white shadow-[0_24px_50px_-34px_rgba(249,115,22,0.7)] ${isInteractive ? 'cursor-pointer transition hover:brightness-105' : ''}`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/80">Resurfacing</p>
      {loading ? (
        <p className="mt-4 text-sm text-white/80">Loading resurfacing...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-white/80">Unable to load resurfacing.</p>
      ) : !isSignedIn ? (
        <p className="mt-4 text-sm text-white/80">Sign in to see your highlights.</p>
      ) : (
        <>
          <div className="mt-3 flex items-start justify-between gap-3">
            <h4 className="text-lg font-semibold">{title}</h4>
            {dateLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                {dateLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-white/80">{description}</p>
          {highlight && <p className="mt-3 text-sm font-semibold text-white">{highlight}</p>}
          {items && items.length > 0 && (
            <div className="mt-3 space-y-1 text-xs text-white/90">
              {items.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResurfacingCard;
