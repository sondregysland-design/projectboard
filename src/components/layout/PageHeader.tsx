interface PageHeaderProps {
  title: string;
  highlight: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  highlight,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          {title}
          <span className="text-primary">{highlight}</span>
        </h1>
        <p className="mt-1 text-sm text-text-light">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
