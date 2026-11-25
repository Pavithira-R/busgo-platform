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
import { email, fullName, mobile, optional, password } from '../lib/validation';

const fields = z.object({
  fullName,
  email,
  phone: optional(mobile),
  password,
});
// Checked separately so a mismatch shows even while other fields have
// errors (a refine on the whole object only runs once every field is valid).
const passwordsMatch = z
  .object({ password: z.string(), confirmPassword: z.string() })
  .refine((f) => f.password === f.confirmPassword, {
    message: 'errors.passwordMatch',
    path: ['confirmPassword'],
  });
const schema = fields.and(passwordsMatch);
type RegisterInput = z.input<typeof schema>;
type RegisterForm = z.output<typeof schema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';

  const form = useForm<RegisterInput, unknown, RegisterForm>({
    resolver: zodResolver(schema),
  });
  const register = useMutation({
    mutationFn: ({ confirmPassword: _confirm, ...body }: RegisterForm) =>
      api<AuthResponse>('/auth/register', { method: 'POST', body }),
    onSuccess: (auth) => {
      signIn(auth);
      void navigate(from, { replace: true });
    },
  });
  const { errors } = form.formState;

  return (
    <FormCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => register.mutate(values))}
      >
        {register.error && (
          <ErrorMessage>{register.error.message}</ErrorMessage>
        )}
        <TextField
          label={t('auth.fullName')}
          autoComplete="name"
          error={errors.fullName}
          {...form.register('fullName')}
        />
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={errors.email}
          {...form.register('email')}
        />
        <TextField
          label={t('auth.phone')}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          hint={t('auth.phoneHint')}
          error={errors.phone}
          {...form.register('phone')}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          error={errors.password}
          {...form.register('password')}
        />
        <TextField
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...form.register('confirmPassword')}
        />
        <Button
          type="submit"
          disabled={register.isPending}
          className="mt-2 w-full"
        >
          {register.isPending
            ? t('auth.submittingRegister')
            : t('auth.submitRegister')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {t('auth.haveAccount')}{' '}
        <Link
          to="/login"
          state={{ from }}
          className="font-semibold text-brand-700 hover:underline dark:text-brand-200"
        >
          {t('nav.login')}
        </Link>
      </p>
    </FormCard>
  );
}
