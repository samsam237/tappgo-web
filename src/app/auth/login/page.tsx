import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Décoration de fond élégante */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10 animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-strong p-8 border border-white/50">
          <div className="text-center">
            <div className="mx-auto flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-soft">
                <Logo size="lg" showText={false} />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Connexion à TAPP+
            </h2>
            <p className="mt-3 text-sm text-gray-600 font-medium">
              Gestion des rappels d'interventions médicales
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
