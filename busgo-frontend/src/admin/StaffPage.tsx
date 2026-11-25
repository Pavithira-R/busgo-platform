import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { TextField } from '../components/form';
import { Button, Card, ErrorMessage, Spinner } from '../components/ui';
import { dateInSriLanka, formatDate } from '../lib/dates';
import { email, fullName, mobile, optional, password } from '../lib/validation';
import { useCreateStaff, useSetUserActive, useStaff } from './queries';
import type { StaffMember } from './types';
import { AdminTable, LinkButton, StatusBadge } from './ui';

const schema = z.object({
  fullName,
  email,
  phone: optional(mobile),
  password,
});
type StaffInput = z.input<typeof schema>;
type StaffForm = z.output<typeof schema>;

/** /admin/staff: gate staff (who scan tickets) and admin accounts. */
export function StaffPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const staff = useStaff();
  const setActive = useSetUserActive();
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  const toggle = (member: StaffMember) => {
    if (
      member.isActive &&
      !window.confirm(
        t('admin.people.confirmDeactivate', { name: member.fullName }),
      )
    ) {
      return;
    }
    setActive.mutate({ id: member.id, isActive: !member.isActive });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('admin.staff.title')}
          </h2>
          <p className="text-sm text-slate-500">{t('admin.staff.subtitle')}</p>
        </div>
        {!adding && (
          <Button
            onClick={() => {
              setAdding(true);
              setCreated(null);
            }}
          >
            {t('admin.staff.add')}
          </Button>
        )}
      </div>

      {created && (
        <p
          role="status"
          className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200 dark:bg-brand-900 dark:text-brand-100 dark:ring-brand-800"
        >
          {t('admin.staff.created', { email: created })}
        </p>
      )}
      {adding && (
        <Card>
          <h3 className="mb-4 font-semibold">{t('admin.staff.add')}</h3>
          <StaffEditor
            onCancel={() => setAdding(false)}
            onCreated={(member) => {
              setAdding(false);
              setCreated(member.email);
            }}
          />
        </Card>
      )}

      {setActive.error && (
        <ErrorMessage>{setActive.error.message}</ErrorMessage>
      )}
      {staff.isPending && <Spinner label={t('common.loading')} />}
      {staff.error && <ErrorMessage>{staff.error.message}</ErrorMessage>}
      {staff.data && (
        <AdminTable
          head={[
            t('auth.fullName'),
            t('admin.people.contact'),
            t('profile.role'),
            t('admin.people.joined'),
            t('admin.status.label'),
            '',
          ]}
        >
          {staff.data.map((member) => (
            <tr key={member.id}>
              <td className="font-medium">{member.fullName}</td>
              <td>
                <span className="break-all">{member.email}</span>
                {member.phone && (
                  <span className="block text-xs text-slate-500">
                    {member.phone}
                  </span>
                )}
              </td>
              <td>{t(`profile.roles.${member.role}`)}</td>
              <td className="whitespace-nowrap">
                {formatDate(dateInSriLanka(member.createdAt), i18n.language, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td>
                <StatusBadge active={member.isActive} />
              </td>
              <td className="text-right">
                {/* Admin accounts (including your own) can't be switched off here. */}
                {member.role === 'staff' && member.id !== user?.id && (
                  <LinkButton
                    disabled={setActive.isPending}
                    onClick={() => toggle(member)}
                    aria-label={t(
                      member.isActive
                        ? 'admin.deactivateNamed'
                        : 'admin.activateNamed',
                      { name: member.fullName },
                    )}
                  >
                    {member.isActive
                      ? t('admin.deactivate')
                      : t('admin.activate')}
                  </LinkButton>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

function StaffEditor({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (member: StaffMember) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateStaff();
  const form = useForm<StaffInput, unknown, StaffForm>({
    resolver: zodResolver(schema),
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) =>
        create.mutate(values, { onSuccess: onCreated }),
      )}
    >
      {create.error && <ErrorMessage>{create.error.message}</ErrorMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('auth.fullName')}
          autoComplete="off"
          error={errors.fullName}
          {...form.register('fullName')}
        />
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="off"
          error={errors.email}
          {...form.register('email')}
        />
        <TextField
          label={t('auth.phone')}
          type="tel"
          hint={t('auth.phoneHint')}
          error={errors.phone}
          {...form.register('phone')}
        />
        <TextField
          label={t('admin.staff.password')}
          type="password"
          autoComplete="new-password"
          hint={t('admin.staff.passwordHint')}
          error={errors.password}
          {...form.register('password')}
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={create.isPending}>
          {t('admin.staff.create')}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {t('admin.cancel')}
        </Button>
      </div>
    </form>
  );
}
