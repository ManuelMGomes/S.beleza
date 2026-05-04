import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, Eye, EyeOff, CheckCircle, Zap, Shield, Users } from "lucide-react";
import registerBg from "@/assets/register-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const highlights = [
  { icon: Zap, text: "Gestão inteligente de salão de beleza" },
  { icon: Shield, text: "Segurança e controlo multi-tenant" },
  { icon: Users, text: "Equipas, clientes e agenda integrados" },
  { icon: CheckCircle, text: "Relatórios e comissões automatizados" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const me = await login(email, password);
      toast.success("Sessão iniciada com sucesso");
      const destination = me?.role === "super_admin" ? "/super-admin" : "/dashboard";
      navigate(destination);
    } catch (error: any) {
      toast.error(error.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={registerBg} alt="" className="w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-primary/20 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex items-center justify-center w-full px-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="glass rounded-2xl shadow-soft overflow-hidden">
            <div className="h-1.5 gradient-hero w-full" />

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-8 flex flex-col justify-center bg-primary/5 border-r border-border/30">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                      <Scissors className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-serif text-lg font-semibold text-foreground">GenOmni Salon</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-2">A plataforma de gestão para salões de excelência</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Aceda ao seu painel de controlo para gerir agendamentos, equipas, stock e finanças num só lugar.
                  </p>
                </div>

                <div className="space-y-3">
                  {highlights.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/30">
                        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.text}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Não tem uma conta? <Link to="/register" className="text-primary hover:underline font-medium">Cadastre a sua empresa</Link>
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="mb-6">
                  <h1 className="font-serif text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
                  <p className="text-sm text-muted-foreground mt-1">Insira as suas credenciais para aceder ao painel</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">E-mail</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors pr-10"
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-11 gradient-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 mt-2">
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-border/40 text-center">
                  <p className="text-xs">
                    <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Voltar ao início</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
