import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
    <div>
      <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
