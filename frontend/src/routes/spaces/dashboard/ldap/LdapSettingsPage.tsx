import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, RefreshCw, Save, ShieldCheck, Trash2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useAtomValue } from "jotai";

import { $api, createMutationOptions, errorMessage } from "@/api";
import { $selectedSpaceId } from "@/store/global-store.ts";
import { useInvalidateUsers } from "@/api/invalidate.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const ldapSettingsSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive(),
  use_ssl: z.boolean().default(false),
  bind_dn: z.string().min(1),
  bind_password: z.string().min(1),
  base_dn: z.string().min(1),
  user_base_dn: z.string().min(1),
  group_base_dn: z.string().min(1),
  user_filter: z.string().min(1),
  group_filter: z.string().min(1),
  username_attr: z.string().min(1),
  email_attr: z.string().min(1),
  name_attr: z.string().min(1),
  first_name_attr: z.string().min(1),
  last_name_attr: z.string().min(1),
  member_of_attr: z.string().min(1),
  deactivate_missing: z.boolean().default(false),
  delete_missing: z.boolean().default(false),
  default_password_length: z.coerce.number().int().min(8),
  join_default_channels: z.boolean().default(false),
});

type LdapSettingsForm = z.infer<typeof ldapSettingsSchema>;

type LdapStatusResponse = {
  success?: boolean;
  message?: string;
  stats?: {
    users_count?: number;
    user_base_dn?: string;
    group_base_dn?: string;
  };
};

type LdapSyncResponse = {
  message?: string;
  stats?: {
    created?: number;
    updated?: number;
    deactivated?: number;
    deleted?: number;
    errors?: number;
  };
};

type MappingRow = {
  id: string;
  ldapGroupDn: string;
  target: string;
};

const defaultValues: LdapSettingsForm = {
  host: "",
  port: 389,
  use_ssl: false,
  bind_dn: "",
  bind_password: "",
  base_dn: "",
  user_base_dn: "ou=user-accounts,ou=test-zone,dc=moevm,dc=info",
  group_base_dn: "ou=user-groups,ou=test-zone,dc=moevm,dc=info",
  user_filter: "(objectClass=inetOrgPerson)",
  group_filter: "(objectClass=groupOfNames)",
  username_attr: "uid",
  email_attr: "mail",
  name_attr: "cn",
  first_name_attr: "givenName",
  last_name_attr: "sn",
  member_of_attr: "memberOf",
  deactivate_missing: false,
  delete_missing: false,
  default_password_length: 16,
  join_default_channels: false,
};

const mappingToRows = (mapping: Record<string, string> | undefined): MappingRow[] =>
  Object.entries(mapping ?? {}).map(([ldapGroupDn, target], index) => ({
    id: `${ldapGroupDn}-${index}`,
    ldapGroupDn,
    target,
  }));

const rowsToMapping = (rows: MappingRow[]): Record<string, string> =>
  Object.fromEntries(
    rows
      .map((row) => [row.ldapGroupDn.trim(), row.target.trim()] as const)
      .filter(([ldapGroupDn, target]) => ldapGroupDn && target),
  );

function MappingEditor(props: {
  title: string;
  groupPlaceholder: string;
  targetPlaceholder: string;
  rows: MappingRow[];
  onChange: (rows: MappingRow[]) => void;
}) {
  const updateRow = (id: string, patch: Partial<MappingRow>) => {
    props.onChange(props.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    props.onChange([...props.rows, { id: crypto.randomUUID(), ldapGroupDn: "", target: "" }]);
  };

  const removeRow = (id: string) => {
    props.onChange(props.rows.filter((row) => row.id !== id));
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-medium">{props.title}</span>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus />
          Добавить
        </Button>
      </div>
      <div className="grid gap-3">
        {props.rows.length === 0 && <p className="text-sm text-muted-foreground">Маппинг не настроен</p>}
        {props.rows.map((row) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input
              value={row.ldapGroupDn}
              onChange={(event) => updateRow(row.id, { ldapGroupDn: event.target.value })}
              placeholder={props.groupPlaceholder}
            />
            <Input
              value={row.target}
              onChange={(event) => updateRow(row.id, { target: event.target.value })}
              placeholder={props.targetPlaceholder}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => removeRow(row.id)}>
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LdapStatusPanel(props: {
  status: LdapStatusResponse | null;
  syncResult: LdapSyncResponse | null;
  isTesting: boolean;
  isSyncing: boolean;
  onTest: () => void;
  onSync: () => void;
}) {
  const statusVariant = props.status?.success ? "default" : props.status ? "destructive" : "secondary";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-primary" />
          <span>LDAP</span>
        </div>
        <Badge variant={statusVariant}>{props.status ? (props.status.success ? "Доступен" : "Ошибка") : "Не проверено"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={props.onTest} disabled={props.isTesting || props.isSyncing}>
            {props.isTesting ? <Loader2 className="animate-spin" /> : <Unplug />}
            Проверить
          </Button>
          <Button type="button" onClick={props.onSync} disabled={props.isTesting || props.isSyncing}>
            {props.isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Синхронизировать
          </Button>
        </div>

        {props.status && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div>{props.status.message}</div>
            {props.status.stats && (
              <div className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-3">
                <span>Пользователей: {props.status.stats.users_count ?? 0}</span>
                <span className="break-all">Users DN: {props.status.stats.user_base_dn}</span>
                <span className="break-all">Groups DN: {props.status.stats.group_base_dn}</span>
              </div>
            )}
          </div>
        )}

        {props.syncResult?.stats && (
          <div className="grid gap-2 text-sm sm:grid-cols-5">
            <div className="rounded-md border p-3">Создано: {props.syncResult.stats.created ?? 0}</div>
            <div className="rounded-md border p-3">Обновлено: {props.syncResult.stats.updated ?? 0}</div>
            <div className="rounded-md border p-3">Отключено: {props.syncResult.stats.deactivated ?? 0}</div>
            <div className="rounded-md border p-3">Удалено: {props.syncResult.stats.deleted ?? 0}</div>
            <div className="rounded-md border p-3">Ошибок: {props.syncResult.stats.errors ?? 0}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LdapSettingsPage() {
  const selectedSpaceId = useAtomValue($selectedSpaceId);
  const invalidateUsers = useInvalidateUsers();
  const [status, setStatus] = useState<LdapStatusResponse | null>(null);
  const [syncResult, setSyncResult] = useState<LdapSyncResponse | null>(null);
  const [roleMappings, setRoleMappings] = useState<MappingRow[]>([]);
  const [channelMappings, setChannelMappings] = useState<MappingRow[]>([]);

  const form = useForm<LdapSettingsForm>({
    reValidateMode: "onChange",
    mode: "all",
    resolver: zodResolver(ldapSettingsSchema),
    defaultValues,
  });

  const configQuery = $api.useQuery(
    "get",
    "/spaces/{space_id}/ldap/config",
    {
      params: {
        path: {
          space_id: selectedSpaceId ?? "",
        },
      },
    },
    {
      enabled: !!selectedSpaceId,
    },
  );

  const saveConfig = $api.useMutation(
    "put",
    "/spaces/{space_id}/ldap/config",
    createMutationOptions({
      onSuccess: async () => {
        await configQuery.refetch();
      },
    }),
  );

  const testConnection = $api.useMutation("get", "/spaces/{space_id}/ldap/status", {
    onSuccess: (data) => {
      setStatus(data as LdapStatusResponse);
    },
    onError: (error) => {
      toast.error("Ошибка проверки LDAP", { description: errorMessage(error) });
    },
  });

  const syncLdap = $api.useMutation("post", "/spaces/{space_id}/ldap/sync", {
    onSuccess: (data) => {
      setSyncResult(data as LdapSyncResponse);
      invalidateUsers();
      toast.success("Синхронизация LDAP завершена");
    },
    onError: (error) => {
      toast.error("Ошибка синхронизации LDAP", { description: errorMessage(error) });
    },
  });

  useEffect(() => {
    if (!configQuery.data) {
      return;
    }

    form.reset({
      host: configQuery.data.host,
      port: configQuery.data.port,
      use_ssl: configQuery.data.use_ssl,
      bind_dn: configQuery.data.bind_dn,
      bind_password: "",
      base_dn: configQuery.data.base_dn,
      user_base_dn: configQuery.data.user_base_dn,
      group_base_dn: configQuery.data.group_base_dn,
      user_filter: configQuery.data.user_filter,
      group_filter: configQuery.data.group_filter,
      username_attr: configQuery.data.username_attr,
      email_attr: configQuery.data.email_attr,
      name_attr: configQuery.data.name_attr,
      first_name_attr: configQuery.data.first_name_attr,
      last_name_attr: configQuery.data.last_name_attr,
      member_of_attr: configQuery.data.member_of_attr,
      deactivate_missing: configQuery.data.deactivate_missing,
      delete_missing: configQuery.data.delete_missing,
      default_password_length: configQuery.data.default_password_length,
      join_default_channels: configQuery.data.join_default_channels,
    });
    setRoleMappings(mappingToRows(configQuery.data.group_role_mapping));
    setChannelMappings(mappingToRows(configQuery.data.group_channel_mapping));
  }, [configQuery.data, form]);

  function onSubmit(values: LdapSettingsForm) {
    if (!selectedSpaceId) {
      return;
    }

    console.log("Submitting", values, roleMappings, channelMappings);

    saveConfig.mutate({
      params: {
        path: {
          space_id: selectedSpaceId,
        },
      },
      body: {
        ...values,
        group_role_mapping: rowsToMapping(roleMappings),
        group_channel_mapping: rowsToMapping(channelMappings),
      },
    });
  }

  function handleTestConnection() {
    if (!selectedSpaceId) {
      return;
    }

    testConnection.mutate({
      params: {
        path: {
          space_id: selectedSpaceId,
        },
      },
    });
  }

  function handleSync() {
    if (!selectedSpaceId) {
      return;
    }

    syncLdap.mutate({
      params: {
        path: {
          space_id: selectedSpaceId,
        },
      },
    });
  }

  if (configQuery.isLoading) {
    return (
      <div className="flex w-full max-w-[1160px] flex-col gap-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[1160px] flex-col gap-6 p-4">
      <span className="text-4xl">LDAP</span>

      <LdapStatusPanel
        status={status}
        syncResult={syncResult}
        isTesting={testConnection.isPending}
        isSyncing={syncLdap.isPending}
        onTest={handleTestConnection}
        onSync={handleSync}
      />

      {configQuery.error && (
        <div className="rounded-md border border-destructive p-3 text-sm text-destructive">{errorMessage(configQuery.error)}</div>
      )}

      <Card className="w-full">
        <CardHeader>Настройки подключения</CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хост</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Порт</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bind_dn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bind DN</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="base_dn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base DN</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="use_ssl"
                  render={({ field }) => (
                    <FormItem className="flex items-end gap-3 pb-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>SSL</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="user_base_dn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Users Base DN</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="group_base_dn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Groups Base DN</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user_filter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фильтр пользователей</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="group_filter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фильтр групп</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="username_attr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username attr</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email_attr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email attr</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_attr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name attr</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="first_name_attr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name attr</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name_attr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name attr</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="member_of_attr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MemberOf attr</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="default_password_length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Длина пароля</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-3 rounded-md border p-3">
                  <FormField
                    control={form.control}
                    name="join_default_channels"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Добавлять в стандартные каналы</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deactivate_missing"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Деактивировать отсутствующих</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="delete_missing"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="grid gap-1">
                          <FormLabel>Удалять отсутствующих</FormLabel>
                          {field.value && (
                            <p className="text-sm text-destructive">Удалит пользователей Rocket.Chat, которые не попали в текущий LDAP-фильтр.</p>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <MappingEditor
                  title="Маппинг LDAP-групп в роли Rocket.Chat"
                  groupPlaceholder="cn=cs-teachers,ou=user-groups,ou=test-zone,dc=moevm,dc=info"
                  targetPlaceholder="admin"
                  rows={roleMappings}
                  onChange={setRoleMappings}
                />
                <MappingEditor
                  title="Маппинг LDAP-групп в каналы Rocket.Chat"
                  groupPlaceholder="cn=group-NNNN,ou=user-groups,ou=test-zone,dc=moevm,dc=info"
                  targetPlaceholder="general"
                  rows={channelMappings}
                  onChange={setChannelMappings}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <FormField
                  control={form.control}
                  name="bind_password"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={saveConfig.isPending} className="sm:mb-[1px]">
                  {saveConfig.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Сохранить
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LdapSettingsPage;
