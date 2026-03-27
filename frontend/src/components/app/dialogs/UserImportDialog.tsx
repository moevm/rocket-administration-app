import { FileDialog } from "@/components/app/dialogs/FileDialog.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { toast } from "sonner";
import { $api, createMutationOptions } from "@/api";
import { useAtomValue } from "jotai/index";
import { $selectedSpaceId } from "@/store/global-store.ts";
import React, { useEffect, useState } from "react";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import { useInvalidateUsers } from "@/api/invalidate.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface UserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FormSchema = z.object({
  verified: z.boolean().default(false).optional(),
  requirePasswordChange: z.boolean().default(false).optional(),
  joinDefaultChannels: z.boolean().default(true).optional(),
  sendEmail: z.boolean().default(false).optional(),
});

const roles = [
  { value: "user", label: "user" },
  { value: "bot", label: "bot" },
  { value: "admin", label: "admin" },
  { value: "moderator", label: "moderator" },
  { value: "leader", label: "leader" },
  { value: "owner", label: "owner" },
  { value: "app", label: "app" },
  { value: "guest", label: "guest" },
  { value: "anonymous", label: "anonymous" },
  { value: "livechat-agent", label: "livechat-agent" },
  { value: "livechat-manager", label: "livechat-manager" },
  { value: "livechat-monitor", label: "livechat-monitor" },
];

const RoleMultiSelect = ({
  selectedRoles,
  onRolesChange,
  disabled,
}: {
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const toggleRole = (roleValue: string) => {
    if (selectedRoles.includes(roleValue)) {
      onRolesChange(selectedRoles.filter(r => r !== roleValue));
    } else {
      onRolesChange([...selectedRoles, roleValue]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start h-auto min-h-10"
          disabled={disabled}
        >
          {selectedRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedRoles.map(role => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <span>Выберите роли</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-64"
        side="bottom"
        align="start"
        sideOffset={5}
        collisionPadding={20}
      >
        <div className="max-h-32 overflow-y-auto">
          <Command>
            <CommandGroup>
              {roles.map(role => (
                <CommandItem
                  key={role.value}
                  onSelect={() => toggleRole(role.value)}
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.value)}
                    className="mr-2"
                  />
                  {role.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: true };
  }

  if (password.length < 14) {
    return { valid: false, message: "Пароль должен содержать минимум 14 символов" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Пароль должен содержать хотя бы одну строчную букву" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Пароль должен содержать хотя бы одну заглавную букву" };
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: "Пароль должен содержать хотя бы одну цифру" };
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, message: "Пароль должен содержать хотя бы один символ (например, !@#$%^&*)" };
  }

  let repeatCount = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      repeatCount++;
      if (repeatCount > 3) {
        return { valid: false, message: "Пароль не должен содержать более 3 повторяющихся символов подряд" };
      }
    } else {
      repeatCount = 1;
    }
  }

  return { valid: true };
};

export const UserImportDialog = ({ open, onOpenChange }: UserImportDialogProps) => {
  const selectedSpaceId = useAtomValue($selectedSpaceId)!;
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [internalStep, setInternalStep] = useState(0);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);
  const [rawFileObjects, setRawFileObjects] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<number, string | null>>({});

  const invalidate = useInvalidateUsers();

  const { mutate, isPending } = $api.useMutation(
    "post",
    "/spaces/{space_id}/users/",
    createMutationOptions({
      async onSuccess(data) {
        setSuccess(true);
        setSuccessData(data);
        setInternalStep(2);
        invalidate();
        setIsImporting(false);
      },
      onError: (error) => {
        toast.error("Ошибка импорта: " + (error.message || "Неизвестная ошибка"));
        setIsImporting(false);
      },
    })
  );

  useEffect(() => {
    if (!open) {
      setInternalStep(0);
      setSuccess(false);
      setSuccessData(null);
      setPreviewUsers([]);
      setRawFileObjects(null);
      setIsImporting(false);
      setPasswordErrors({});
    }
  }, [open]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    disabled: isPending || isImporting,
  });

  const parseAndValidateObjects = (objects: any[]): any[] | null => {
    const validUsers: any[] = [];
    for (let object of objects) {
      object = Object.fromEntries(Object.entries(object).map(([k, v]) => ([k.toLowerCase(), v])));

      if (!object.hasOwnProperty("username") || String(object["username"]) == "null") {
        console.info({ error: object });
        toast.error("Не найден обязательный параметр username");
        return null;
      }

      if (object.hasOwnProperty("emails")) {
        object["email"] = object["emails"];
      }

      if (!object.hasOwnProperty("email") || String(object["email"]) == "null") {
        toast.error("Не найден обязательный параметр email");
        return null;
      }

      if (typeof object["email"] !== "string" || object["email"].startsWith("[")) {
        let emails;
        if (typeof object["email"] === "string") {
          emails = JSON.parse(object["email"]);
        } else {
          emails = object["email"];
        }

        if (emails.length === 0) {
          toast.error("Не заполнен email для пользователя " + object["username"]);
          return null;
        }
        object["email"] = emails[0].address;
      }

      if (!object.hasOwnProperty("name") || String(object["name"]) == "null") {
        toast.error("Не найден обязательный параметр name");
        return null;
      }

      validUsers.push({
        username: object.username,
        email: object.email,
        name: object.name,
        roles: ["user"],
        password: "",
      });
    }
    return validUsers;
  };

  const handleFileSubmit = (objects: any[]) => {
    const isSameFile = rawFileObjects && JSON.stringify(objects) === JSON.stringify(rawFileObjects);
    if (isSameFile && internalStep === 0 && previewUsers.length > 0) {
      setInternalStep(1);
      return false;
    }

    const validUsers = parseAndValidateObjects(objects);
    if (!validUsers) return false;
    setPreviewUsers(validUsers);
    setRawFileObjects(objects);
    setInternalStep(1);
    return false;
  };

  const updateUserField = (index: number, field: string, value: any) => {
    setPreviewUsers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (field === 'password') {
      const { valid, message } = validatePassword(value);
      setPasswordErrors(prev => ({
        ...prev,
        [index]: valid ? null : message || 'Некорректный пароль',
      }));
    }
  };

  const handleConfirmImport = () => {
    const hasErrors = Object.values(passwordErrors).some(error => error !== null);
    if (hasErrors) {
      toast.error("Пожалуйста, исправьте ошибки в паролях перед импортом");
      return;
    }

    const settings = form.getValues();
    const usersToImport = previewUsers.map((user) => ({
      username: user.username,
      email: user.email,
      name: user.name,
      roles: user.roles,
      ...(user.password ? { password: user.password } : {}),
    }));

    setIsImporting(true);
    mutate({
      body: {
        users: usersToImport,
        verified: settings.verified || false,
        requirePasswordChange: settings.requirePasswordChange || false,
        joinDefaultChannels: settings.joinDefaultChannels || false,
        sendEmail: settings.sendEmail || false,
      },
      params: {
        path: {
          space_id: selectedSpaceId,
        },
      },
    });
  };

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="border rounded-md overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Никнейм</TableHead>
              <TableHead>Почта</TableHead>
              <TableHead>Имя</TableHead>
              <TableHead>Роли</TableHead>
              <TableHead>Пароль (опционально)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewUsers.map((user, idx) => (
              <TableRow key={idx}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <RoleMultiSelect
                    selectedRoles={user.roles}
                    onRolesChange={(newRoles) => updateUserField(idx, "roles", newRoles)}
                    disabled={isImporting}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <Input
                      type="text"
                      placeholder="Автогенерация"
                      value={user.password}
                      onChange={(e) => updateUserField(idx, "password", e.target.value)}
                    />
                    {passwordErrors[idx] && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors[idx]}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setInternalStep(0)}>Назад</Button>
      </div>
    </div>
  );

  const getContent = () => {
    if (internalStep === 0) {
      return (
        <div className="space-y-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="verified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Автоматически подтвердить аккаунты</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requirePasswordChange"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Потребовать смену пароля</FormLabel>
                    <FormDescription>Встроенная функция RocketChat</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="joinDefaultChannels"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Присоединиться к каналам по умолчанию</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sendEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Отправить письмо с паролем</FormLabel>
                    <FormDescription>Средствами RocketManager</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </Form>
        </div>
      );
    } else if (internalStep === 1) {
      return renderPreview();
    } else {
      return (
        <ExportCard
          data={successData}
          showData={true}
          countedValues={[
            { key: "created_id", display: "Успех" },
            { key: "error", display: "Ошибка" },
            { key: "email_sent", display: "Email отправлен" },
            { key: "email_error", display: "Ошибка отправки email" },
          ]}
        />
      );
    }
  };

  return (
    <FileDialog
      open={open}
      onOpenChange={onOpenChange}
      dialogStep={internalStep === 2 ? 0 : 1}
      title="Импорт"
      description={
        internalStep === 0
          ? "Обязательные поля: username, email, name"
          : internalStep === 1
          ? "Проверьте и отредактируйте данные пользователей"
          : "Результат импорта"
      }
      loading={isPending || isImporting}
      content={getContent()}
      onSubmit={internalStep === 0 ? handleFileSubmit : handleConfirmImport}
      submitEnabled={internalStep !== 2}
      submitButtonText={internalStep === 0 ? "Детали импорта" : "Импорт"}
    />
  );
};
