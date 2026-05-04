import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

const StatCard = ({ title, value, description, icon: Icon, trend }: StatCardProps) => {
  return (
    <Card className="group shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
