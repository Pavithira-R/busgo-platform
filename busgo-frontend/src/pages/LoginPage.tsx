import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { FormCard, TextField } from '../components/form';
import { Button, ErrorMessage } from '../components/ui';
import { api } from '../lib/api';
import type { AuthResponse } from '../lib/types';
import { email } from '../lib/validation';

const schema = z.object({
  email,
  password: z.string().min(1, 'errors.required'),
});
type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  // Where the user was going before being asked to log in.
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';

  const form = useForm<LoginForm>({ resolver: zodResolver(schema) });
  const login = useMutation({
    mutationFn: (body: LoginForm) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body }),
    onSuccess: (auth) => {
      signIn(auth);
      void navigate(from, { replace: true });
    },
  });

  return (
    <FormCard title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
      >
        {login.error && <ErrorMessage>{login.error.message}</ErrorMessage>}
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={form.formState.errors.email}
          {...form.register('email')}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          error={form.formState.errors.password}
          {...form.register('password')}
        />
        <Button
          type="submit"
          disabled={login.isPending}
          className="mt-2 w-full"
        >
          {login.isPending ? t('auth.submittingLogin') : t('auth.submitLogin')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {t('auth.noAccount')}{' '}
        <Link
          to="/register"
          state={{ from }}
          className="font-semibold text-brand-700 hover:underline dark:text-brand-200"
        >
          {t('nav.register')}
        </Link>
      </p>
    </FormCard>
  );
}
