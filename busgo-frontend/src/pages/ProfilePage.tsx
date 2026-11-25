import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { FormCard, TextField } from '../components/form';
import { Button, ErrorMessage } from '../components/ui';
import { api } from '../lib/api';
import { session } from '../lib/session';
import type { User } from '../lib/types';
import { fullName, mobile, nic, optional } from '../lib/validation';

const schema = z.object({
  fullName,
  phone: optional(mobile),
  idNumber: optional(nic),
});
type ProfileInput = z.input<typeof schema>;
type ProfileForm = z.output<typeof schema>;

/** Name, mobile and NIC: used to pre-fill passenger details when booking. */
export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ProfileInput, unknown, ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      idNumber: user?.idNumber ?? '',
    },
  });
  const save = useMutation({
    mutationFn: (values: ProfileForm) =>
      api<User>('/auth/me', {
        method: 'PATCH',
        // Cleared fields are saved as "no value".
        body: {
          fullName: values.fullName,
          phone: values.phone ?? null,
          idNumber: values.idNumber ?? null,
        },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me', session.getToken()], updated);
      form.reset({
        fullName: updated.fullName,
        phone: updated.phone ?? '',
        idNumber: updated.idNumber ?? '',
      });
    },
  });
  const { errors, isDirty } = form.formState;

  if (!user) return null;
  return (
    <FormCard title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800">
        <dt className="text-slate-500">{t('profile.email')}</dt>
        <dd className="font-medium break-all">{user.email}</dd>
        <dt className="text-slate-500">{t('profile.role')}</dt>
        <dd className="font-medium">{t(`profile.roles.${user.role}`)}</dd>
      </dl>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        {save.error && <ErrorMessage>{save.error.message}</ErrorMessage>}
        {save.isSuccess && !isDirty && (
          <p
            role="status"
            className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200 dark:bg-brand-900 dark:text-brand-100 dark:ring-brand-800"
          >
            {t('profile.saved')}
          </p>
        )}
        <TextField
          label={t('auth.fullName')}
          autoComplete="name"
          error={errors.fullName}
          {...form.register('fullName')}
        />
        <TextField
          label={t('auth.phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint={t('auth.phoneHint')}
          error={errors.phone}
          {...form.register('phone')}
        />
        <TextField
          label={t('profile.nic')}
          hint={t('profile.nicHint')}
          error={errors.idNumber}
          {...form.register('idNumber')}
        />
        <Button
          type="submit"
          disabled={save.isPending || !isDirty}
          className="mt-2 w-full"
        >
          {save.isPending ? t('profile.saving') : t('profile.save')}
        </Button>
      </form>
    </FormCard>
  );
}
