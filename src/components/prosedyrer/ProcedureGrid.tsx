interface ProcedureGridProps {
  children: React.ReactNode;
}

export function ProcedureGrid({ children }: ProcedureGridProps) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
      {children}
    </div>
  );
}
