import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Scissors, ArrowLeft, ArrowRight, Building2, UserCog, Sparkles } from "lucide-react";
import ImageUpload from "@/components/register/ImageUpload";
import registerBg from "@/assets/register-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Register = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyNif, setCompanyNif] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminPhotoPreview, setAdminPhotoPreview] = useState<string | null>(null);

  const navigate = useNavigate();
  const { registerTenant } = useAuth();

  const handleImageChange = (file: File | null, setPreview: (p: string | null) => void) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleContinueToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== adminConfirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      await registerTenant({
        company_name: companyName,
        company_email: companyEmail,
        company_phone: companyPhone,
        company_nif: companyNif,
        company_address: companyAddress,
        company_city: "Luanda",
        admin_name: adminName,
        admin_email: adminEmail,
        admin_phone: adminPhone,
        admin_password: adminPassword,
      });
      setShowSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={registerBg} alt="" className="w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-primary/20 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex items-center justify-center w-full px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="glass rounded-2xl shadow-soft overflow-hidden">
            <div className="h-1.5 gradient-hero w-full" />

            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <Scissors className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-serif text-lg font-semibold text-foreground">GenOmni Salon</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">{step === 1 ? "Cadastrar Empresa" : "Cadastrar Administrador"}</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {step === 1 ? "Preencha os dados da sua empresa para começar" : "Crie a conta do administrador da empresa"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"}`}>
                  <Building2 className="h-3.5 w-3.5" /> Empresa
                </div>
                <div className="flex items-center gap-0.5">
                  <div className={`w-2 h-0.5 rounded-full ${step >= 1 ? "bg-primary" : "bg-border"}`} />
                  <div className={`w-2 h-0.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-border"}`} />
                  <div className={`w-2 h-0.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-border"}`} />
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"}`}>
                  <UserCog className="h-3.5 w-3.5" /> Admin
                </div>
              </div>

              {step === 1 ? (
                <form onSubmit={handleContinueToAdmin} className="space-y-4">
                  <ImageUpload label="Logotipo da Empresa" preview={companyLogoPreview} onChange={(file) => handleImageChange(file, setCompanyLogoPreview)} icon={<Building2 className="h-5 w-5" />} shape="rounded" />

                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-xs font-medium">Nome da Empresa *</Label>
                      <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="h-10 bg-background/50" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="companyEmail" className="text-xs font-medium">E-mail *</Label>
                        <Input id="companyEmail" type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} required className="h-10 bg-background/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="companyPhone" className="text-xs font-medium">Telefone *</Label>
                        <Input id="companyPhone" type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} required className="h-10 bg-background/50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="companyNif" className="text-xs font-medium">NIF *</Label>
                        <Input id="companyNif" value={companyNif} onChange={(e) => setCompanyNif(e.target.value)} required className="h-10 bg-background/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="companyAddress" className="text-xs font-medium">Endereço</Label>
                        <Input id="companyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="h-10 bg-background/50" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 gap-2 gradient-primary text-primary-foreground mt-2">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <ImageUpload label="Foto do Administrador" preview={adminPhotoPreview} onChange={(file) => handleImageChange(file, setAdminPhotoPreview)} icon={<UserCog className="h-5 w-5" />} shape="circle" />

                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="adminName" className="text-xs font-medium">Nome Completo *</Label>
                      <Input id="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)} required className="h-10 bg-background/50" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="adminEmail" className="text-xs font-medium">E-mail *</Label>
                        <Input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required className="h-10 bg-background/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adminPhone" className="text-xs font-medium">Telefone *</Label>
                        <Input id="adminPhone" type="tel" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} required className="h-10 bg-background/50" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="adminPassword" className="text-xs font-medium">Senha *</Label>
                        <Input id="adminPassword" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} minLength={8} required className="h-10 bg-background/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adminConfirmPassword" className="text-xs font-medium">Confirmar Senha *</Label>
                        <Input id="adminConfirmPassword" type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} minLength={8} required className="h-10 bg-background/50" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-1.5 h-11">
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-11 gap-2 gradient-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" /> {loading ? "A criar..." : "Criar Conta"}
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-border/40 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta? <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
                </p>
                <p className="text-xs">
                  <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Voltar ao início</Link>
                </p>
              </div>
            </div>
          </div>

          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader className="items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <DialogTitle className="font-serif text-xl">Cadastro Realizado com Sucesso!</DialogTitle>
                <DialogDescription>A sua empresa e conta de administrador foram criadas. Você já pode aceder ao sistema.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>Voltar para a página inicial</Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard")}>Entrar no sistema</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Register;
