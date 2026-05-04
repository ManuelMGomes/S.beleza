import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { api } from "@/lib/api";

const typeConfig: Record<string, { label: string; className: string }> = {
  create: { label: "Criação", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "Actualização", className: "bg-blue-50 text-blue-700 border-blue-200" },
  delete: { label: "Exclusão", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const Audit = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState("Todas");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.dashboard.audit();
        setLogs(data);
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar auditoria");
      }
    };

    load();
  }, []);

  const areas = useMemo(() => {
    const values = Array.from(new Set(logs.map((log) => log.area).filter(Boolean))).sort();
    return ["Todas", ...values];
  }, [logs]);

  const filtered = useMemo(
    () => (selectedArea === "Todas" ? logs : logs.filter((log) => log.area === selectedArea)),
    [logs, selectedArea]
  );

  const areaStats = useMemo(
    () =>
      areas
        .filter((area) => area !== "Todas")
        .map((area) => ({
          area,
          count: logs.filter((log) => log.area === area).length,
        }))
        .sort((a, b) => b.count - a.count),
    [areas, logs]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" subtitle="Log real das ações executadas no sistema" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {areaStats.map(({ area, count }) => (
          <Card
            key={area}
            className={`cursor-pointer shadow-sm transition-all hover:shadow-md ${selectedArea === area ? "border-primary ring-1 ring-primary/20" : ""}`}
            onClick={() => setSelectedArea(selectedArea === area ? "Todas" : area)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="text-[11px] text-muted-foreground">{area}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden shadow-card">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <ShieldCheck className="h-4 w-4 text-primary" /> Actividade Recente
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {filtered.map((log) => {
              const parsedDate = log.timestamp ? new Date(log.timestamp) : null;
              const formattedTimestamp =
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleString("pt-AO")
                  : log.timestamp;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-xl border border-border/30 bg-secondary/40 p-3 transition-colors hover:bg-secondary/60"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{log.user}</span>
                      <span className="text-sm text-muted-foreground">{log.action}</span>
                      <Badge variant="outline" className={`px-2 text-[10px] ${typeConfig[log.type]?.className || ""}`}>
                        {typeConfig[log.type]?.label || "Actualização"}
                      </Badge>
                      <Badge variant="secondary" className="px-2 text-[10px]">
                        {log.area}
                      </Badge>
                    </div>
                    {log.target ? <p className="mt-0.5 text-xs text-muted-foreground">{log.target}</p> : null}
                    <p className="mt-0.5 tabular-nums text-[10px] text-muted-foreground/60">{formattedTimestamp}</p>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Ainda não existem registos reais para esta área.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
