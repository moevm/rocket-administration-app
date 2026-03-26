import {useEffect, useMemo, useRef, useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {Loader2} from "lucide-react";

import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import {errorMessage} from "@/api";
import {
    DEFAULT_EMAIL_TEMPLATES,
    EMAIL_TEMPLATE_CONFIGS,
    EmailTemplateCollection,
    EmailTemplateKey,
    findMissingRequiredVariables,
    findUnknownVariables,
    previewEmailTemplate,
    saveEmailTemplate,
    testSendEmailTemplate,
    fetchEmailTemplates,
} from "@/api/email-templates-stub.ts";

const templateSchema = z.object({
    subject: z.string().trim().min(1, "Обязательное поле"),
    body: z.string().trim().min(1, "Обязательное поле"),
});

type TemplateFormData = z.infer<typeof templateSchema>;

function toToken(name: string): string {
    return `{{${name}}}`;
}

function EmailTemplatesSettings(props: {
    spaceId: string;
    spaceUrl: string;
}) {
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<EmailTemplateKey>("welcome_user");
    const [templates, setTemplates] = useState<EmailTemplateCollection>(DEFAULT_EMAIL_TEMPLATES);
    const [activeField, setActiveField] = useState<"subject" | "body">("body");
    const [previewData, setPreviewData] = useState<TemplateFormData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isTestSending, setIsTestSending] = useState(false);

    const subjectInputRef = useRef<HTMLInputElement | null>(null);
    const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    const selectedConfig = EMAIL_TEMPLATE_CONFIGS[selectedTemplateKey];

    const form = useForm<TemplateFormData>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(templateSchema),
        defaultValues: DEFAULT_EMAIL_TEMPLATES[selectedTemplateKey],
        disabled: isLoading || isSaving || isPreviewLoading || isTestSending,
    });

    useEffect(() => {
        let isActive = true;

        async function loadTemplates() {
            if (!props.spaceId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetchEmailTemplates(props.spaceId);
                if (!isActive) {
                    return;
                }
                setTemplates(response);
            } catch (error) {
                if (isActive) {
                    toast.error("Ошибка загрузки шаблонов", {description: errorMessage(error)});
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        loadTemplates();
        return () => {
            isActive = false;
        };
    }, [props.spaceId]);

    useEffect(() => {
        form.reset(templates[selectedTemplateKey]);
        setPreviewData(null);
    }, [form, selectedTemplateKey, templates]);

    const watchedSubject = form.watch("subject");
    const watchedBody = form.watch("body");

    const missingRequiredVariables = useMemo(() => {
        return findMissingRequiredVariables({
            subject: watchedSubject,
            body: watchedBody,
            requiredVariables: selectedConfig.requiredVariables,
        });
    }, [selectedConfig.requiredVariables, watchedBody, watchedSubject]);

    const unknownVariables = useMemo(() => {
        return findUnknownVariables({
            subject: watchedSubject,
            body: watchedBody,
            availableVariables: selectedConfig.availableVariables,
        });
    }, [selectedConfig.availableVariables, watchedBody, watchedSubject]);

    function insertVariable(variableName: string) {
        const token = toToken(variableName);
        const targetName = activeField;
        const targetRef = targetName === "subject" ? subjectInputRef.current : bodyTextareaRef.current;
        const currentValue = form.getValues(targetName);

        if (!targetRef) {
            form.setValue(targetName, `${currentValue}${token}`, {
                shouldDirty: true,
                shouldValidate: true,
            });
            return;
        }

        const start = targetRef.selectionStart ?? currentValue.length;
        const end = targetRef.selectionEnd ?? currentValue.length;
        const nextValue = `${currentValue.slice(0, start)}${token}${currentValue.slice(end)}`;

        form.setValue(targetName, nextValue, {
            shouldDirty: true,
            shouldValidate: true,
        });

        requestAnimationFrame(() => {
            targetRef.focus();
            const caretPosition = start + token.length;
            targetRef.setSelectionRange(caretPosition, caretPosition);
        });
    }

    function validateTemplateForSave(values: TemplateFormData): boolean {
        form.clearErrors("body");

        const missingRequired = findMissingRequiredVariables({
            subject: values.subject,
            body: values.body,
            requiredVariables: selectedConfig.requiredVariables,
        });

        if (missingRequired.length > 0) {
            form.setError("body", {
                type: "manual",
                message: `Добавьте обязательные переменные: ${missingRequired.map(toToken).join(", ")}`,
            });
            return false;
        }

        const unknown = findUnknownVariables({
            subject: values.subject,
            body: values.body,
            availableVariables: selectedConfig.availableVariables,
        });
        if (unknown.length > 0) {
            form.setError("body", {
                type: "manual",
                message: `Неизвестные переменные: ${unknown.map(toToken).join(", ")}`,
            });
            return false;
        }

        return true;
    }

    const saveHandler = form.handleSubmit(async (values) => {
        if (!validateTemplateForSave(values)) {
            return;
        }

        setIsSaving(true);
        try {
            const savedTemplate = await saveEmailTemplate({
                spaceId: props.spaceId,
                key: selectedTemplateKey,
                template: values,
            });
            setTemplates((prev) => ({
                ...prev,
                [selectedTemplateKey]: savedTemplate,
            }));
            toast.success("Шаблон сохранен");
        } catch (error) {
            toast.error("Ошибка сохранения шаблона", {description: errorMessage(error)});
        } finally {
            setIsSaving(false);
        }
    });

    async function previewHandler() {
        const isValid = await form.trigger(["subject", "body"]);
        if (!isValid) {
            return;
        }

        const values = form.getValues();
        const unknown = findUnknownVariables({
            subject: values.subject,
            body: values.body,
            availableVariables: selectedConfig.availableVariables,
        });
        if (unknown.length > 0) {
            form.setError("body", {
                type: "manual",
                message: `Неизвестные переменные: ${unknown.map(toToken).join(", ")}`,
            });
            return;
        }

        setIsPreviewLoading(true);
        try {
            const preview = await previewEmailTemplate({
                key: selectedTemplateKey,
                template: values,
                context: {
                    space_url: props.spaceUrl,
                },
            });
            setPreviewData(preview);
        } catch (error) {
            toast.error("Ошибка предпросмотра", {description: errorMessage(error)});
        } finally {
            setIsPreviewLoading(false);
        }
    }

    async function testSendHandler() {
        const isValid = await form.trigger(["subject", "body"]);
        if (!isValid) {
            return;
        }

        const values = form.getValues();
        if (!validateTemplateForSave(values)) {
            return;
        }

        setIsTestSending(true);
        try {
            const response = await testSendEmailTemplate({
                key: selectedTemplateKey,
                template: values,
                context: {
                    space_url: props.spaceUrl,
                },
            });
            toast.success(`Тестовая отправка выполнена (${response.recipient})`);
        } catch (error) {
            toast.error("Ошибка тестовой отправки", {description: errorMessage(error)});
        } finally {
            setIsTestSending(false);
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                Шаблоны писем
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={saveHandler} className="space-y-4">
                        <FormItem>
                            <FormLabel>Тип шаблона</FormLabel>
                            <Select
                                value={selectedTemplateKey}
                                onValueChange={(value: EmailTemplateKey) => setSelectedTemplateKey(value)}
                                disabled={isLoading}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите шаблон"/>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="welcome_user">welcome_user</SelectItem>
                                    <SelectItem value="password_changed">password_changed</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>{selectedConfig.description}</FormDescription>
                        </FormItem>

                        <div className="space-y-2">
                            <FormLabel>Доступные переменные</FormLabel>
                            <FormDescription>
                                Нажмите на переменную, она вставится в текущее поле (тема или тело).
                            </FormDescription>
                            <div className="flex flex-wrap gap-2">
                                {selectedConfig.availableVariables.map((variableName) => (
                                    <Button
                                        key={variableName}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => insertVariable(variableName)}
                                        disabled={isLoading}
                                    >
                                        {toToken(variableName)}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                    Обязательные: {selectedConfig.requiredVariables.map(toToken).join(", ")}
                                </Badge>
                                {missingRequiredVariables.length > 0 && (
                                    <Badge variant="destructive">
                                        Не хватает: {missingRequiredVariables.map(toToken).join(", ")}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Тема письма</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            onFocus={() => setActiveField("subject")}
                                            ref={(element) => {
                                                field.ref(element);
                                                subjectInputRef.current = element;
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="body"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Тело письма</FormLabel>
                                    <FormControl>
                                        <textarea
                                            {...field}
                                            rows={8}
                                            onFocus={() => setActiveField("body")}
                                            ref={(element) => {
                                                field.ref(element);
                                                bodyTextareaRef.current = element;
                                            }}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        {unknownVariables.length > 0 && (
                            <div className="text-sm text-destructive">
                                Неизвестные переменные: {unknownVariables.map(toToken).join(", ")}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={previewHandler}
                                disabled={isLoading || isPreviewLoading}
                            >
                                {isPreviewLoading && <Loader2 className="animate-spin"/>}
                                Предпросмотр
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={testSendHandler}
                                disabled={isLoading || isTestSending}
                            >
                                {isTestSending && <Loader2 className="animate-spin"/>}
                                Тестовая отправка
                            </Button>
                            <Button type="submit" disabled={isLoading || isSaving}>
                                {isSaving && <Loader2 className="animate-spin"/>}
                                Сохранить шаблон
                            </Button>
                        </div>
                    </form>
                </Form>

                {previewData && (
                    <div className="mt-6 space-y-2">
                        <div className="font-medium">Предпросмотр</div>
                        <div className="rounded border bg-muted/50 p-3">
                            <div className="text-sm font-medium">Тема</div>
                            <div className="mt-1 whitespace-pre-wrap break-words text-sm">{previewData.subject}</div>
                        </div>
                        <div className="rounded border bg-muted/50 p-3">
                            <div className="text-sm font-medium">Тело</div>
                            <div className="mt-1 whitespace-pre-wrap break-words text-sm">{previewData.body}</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default EmailTemplatesSettings;
