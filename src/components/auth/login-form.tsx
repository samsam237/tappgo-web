'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useApi } from '@/hooks/use-api';
import { setAuthCookies } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const apiClient = useApi();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { user, access_token, refresh_token } = await apiClient.login(
        data.email,
        data.password
      );

      setAuthCookies(access_token, refresh_token);
      
      toast.success(`Bienvenue, ${user.email} !`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Éviter les erreurs d'hydratation en ne rendant le formulaire qu'après le montage
  if (!isMounted) {
    return (
      <div className="mt-8 space-y-6">
        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="label">
              Adresse email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="input"
              placeholder="votre@email.com"
              disabled
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Mot de passe
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
              disabled
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            disabled
            className="btn-primary w-full py-3.5 text-base font-semibold opacity-50"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-5">
        <div>
          <label htmlFor="email" className="label">
            Adresse email
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="input"
            placeholder="votre@email.com"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
              <span className="mr-1">⚠</span>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
              <span className="mr-1">⚠</span>
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3.5 text-base font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Connexion en cours...
            </div>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Se connecter
            </span>
          )}
        </button>
      </div>

      {/* <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          Compte de démonstration :{' '}
          <span className="font-medium text-blue-600">
            admin@meditache.com / admin123
          </span>
        </p>
      </div> */}
    </form>
  );
}
