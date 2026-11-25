import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TextField } from '../components/form';
import { Button, Card, ErrorMessage, Spinner } from '../components/ui';
import { optional } from '../lib/validation';
import { useAdminOperators, useSaveOperator } from './queries';
import type { AdminOperator } from './types';
import { AdminTable, LinkButton, StatusBadge } from './ui';

/** Landline (011 234 5678) or mobile, as operators often list either. */
const phone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => /^(?:0|\+94)\d{9}$/.test(v), 'errors.phone')
  .transform((v) => (v.startsWith('+94') ? `0${v.slice(3)}` : v));

const schema = z.object({
  name: z.string().trim().min(2, 'errors.nameMin').max(100),
  phone: optional(phone),
});
type OperatorInput = z.input<typeof schema>;
type OperatorForm = z.output<typeof schema>;

/** /admin/operators: the private bus companies selling seats on BusGo. */
export function OperatorsPage() {
  const { t } = useTranslation();
  const operators = useAdminOperators();
  const toggle = useSaveOperator();
  const [editing, setEditing] = useState<number | 'new' | null>(null);

  const setActive = (operator: AdminOperator, isActive: boolean) => {
    if (
      !isActive &&
      !window.confirm(
        t('admin.operators.confirmDeactivate', { name: operator.name }),
      )
    ) {
      return;
    }
    toggle.mutate({ id: operator.id, isActive });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('admin.operators.title')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('admin.operators.subtitle')}
          </p>
        </div>
        {editing !== 'new' && (
          <Button onClick={() => setEditing('new')}>
            {t('admin.operators.add')}
          </Button>
        )}
      </div>

      {editing === 'new' && (
        <Card>
          <h3 className="mb-4 font-semibold">{t('admin.operators.add')}</h3>
          <OperatorEditor onDone={() => setEditing(null)} />
        </Card>
      )}

      {toggle.error && <ErrorMessage>{toggle.error.message}</ErrorMessage>}
      {operators.isPending && <Spinner label={t('common.loading')} />}
      {operators.error && (
        <ErrorMessage>{operators.error.message}</ErrorMessage>
      )}
      {operators.data && (
        <AdminTable
          head={[
            t('admin.operators.name'),
            t('admin.operators.phone'),
            t('admin.operators.routes'),
            t('admin.status.label'),
            '',
          ]}
        >
          {operators.data.map((operator) =>
            editing === operator.id ? (
              <tr key={operator.id}>
                <td colSpan={5}>
                  <OperatorEditor
                    operator={operator}
                    onDone={() => setEditing(null)}
                  />
                </td>
              </tr>
            ) : (
              <tr key={operator.id}>
                <td className="font-medium">{operator.name}</td>
                <td className="tabular-nums">{operator.phone ?? '–'}</td>
                <td className="tabular-nums">{operator.routeCount}</td>
                <td>
                  <StatusBadge active={operator.isActive} />
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className="inline-flex gap-4">
                    <LinkButton
                      onClick={() => setEditing(operator.id)}
                      aria-label={t('admin.editNamed', { name: operator.name })}
                    >
                      {t('admin.edit')}
                    </LinkButton>
                    <LinkButton
                      disabled={toggle.isPending}
                      onClick={() => setActive(operator, !operator.isActive)}
                      aria-label={t(
                        operator.isActive
                          ? 'admin.deactivateNamed'
                          : 'admin.activateNamed',
                        { name: operator.name },
                      )}
                    >
                      {operator.isActive
                        ? t('admin.deactivate')
                        : t('admin.activate')}
                    </LinkButton>
                  </span>
                </td>
              </tr>
            ),
          )}
        </AdminTable>
      )}
    </div>
  );
}

/** Add a new operator, or edit one's name and phone. */
function OperatorEditor({
  operator,
  onDone,
}: {
  operator?: AdminOperator;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveOperator();
  const form = useForm<OperatorInput, unknown, OperatorForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: operator?.name ?? '', phone: operator?.phone ?? '' },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) =>
        save.mutate({ id: operator?.id, ...values }, { onSuccess: onDone }),
      )}
    >
      {save.error && <ErrorMessage>{save.error.message}</ErrorMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('admin.operators.name')}
          error={errors.name}
          {...form.register('name')}
        />
        <TextField
          label={t('admin.operators.phone')}
          type="tel"
          hint={t('admin.operators.phoneHint')}
          error={errors.phone}
          {...form.register('phone')}
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={save.isPending}>
          {t('admin.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('admin.cancel')}
        </Button>
      </div>
    </form>
  );
}
