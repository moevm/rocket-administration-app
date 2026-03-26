export type EmailTemplateKey = "welcome_user" | "password_changed";

export type EmailTemplateModel = {
    subject: string;
    body: string;
};

export type EmailTemplateCollection = Record<EmailTemplateKey, EmailTemplateModel>;

export type EmailTemplateConfig = {
    key: EmailTemplateKey;
    label: string;
    description: string;
    availableVariables: string[];
    requiredVariables: string[];
    sampleContext: Record<string, string>;
};

type StoredTemplates = Partial<Record<EmailTemplateKey, Partial<EmailTemplateModel>>>;

const STORAGE_KEY_PREFIX = "rocket_email_templates_v1";

const TOKEN_PATTERN = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;

const wait = (ms: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });

export const EMAIL_TEMPLATE_CONFIGS: Record<EmailTemplateKey, EmailTemplateConfig> = {
    welcome_user: {
        key: "welcome_user",
        label: "welcome_user",
        description: "Письмо отправляется пользователю после создания аккаунта.",
        availableVariables: ["username", "space_url", "password"],
        requiredVariables: ["space_url", "password"],
        sampleContext: {
            username: "new_user",
            space_url: "https://example.space",
            password: "TempPass123",
        },
    },
    password_changed: {
        key: "password_changed",
        label: "password_changed",
        description: "Письмо отправляется пользователю после смены пароля.",
        availableVariables: ["username", "space_url", "password"],
        requiredVariables: ["space_url", "password"],
        sampleContext: {
            username: "existing_user",
            space_url: "https://example.space",
            password: "NewPass456",
        },
    },
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateCollection = {
    welcome_user: {
        subject: "Ваш аккаунт в {{space_url}} создан",
        body: "Добро пожаловать, {{username}}!\n\nВаш временный пароль: {{password}}\n\nПространство: {{space_url}}",
    },
    password_changed: {
        subject: "Пароль изменен в {{space_url}}",
        body: "Здравствуйте, {{username}}.\n\nВаш новый пароль: {{password}}\n\nПространство: {{space_url}}",
    },
};

function getStorageKey(spaceId: string): string {
    return `${STORAGE_KEY_PREFIX}:${spaceId}`;
}

function readStoredTemplates(spaceId: string): StoredTemplates {
    if (!spaceId || typeof window === "undefined") {
        return {};
    }

    const raw = window.localStorage.getItem(getStorageKey(spaceId));
    if (!raw) {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            return {};
        }
        return parsed as StoredTemplates;
    } catch {
        return {};
    }
}

function writeStoredTemplates(spaceId: string, templates: StoredTemplates): void {
    if (!spaceId || typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem(getStorageKey(spaceId), JSON.stringify(templates));
}

function normalizeTemplate(
    value: Partial<EmailTemplateModel> | undefined,
    fallback: EmailTemplateModel,
): EmailTemplateModel {
    return {
        subject: value?.subject ?? fallback.subject,
        body: value?.body ?? fallback.body,
    };
}

function renderTemplateString(template: string, context: Record<string, string>): string {
    return template.replace(TOKEN_PATTERN, (_, variableName: string) => {
        if (Object.prototype.hasOwnProperty.call(context, variableName)) {
            return context[variableName];
        }
        return `{{${variableName}}}`;
    });
}

export function extractTemplateVariables(content: string): string[] {
    const regex = new RegExp(TOKEN_PATTERN.source, "g");
    const variables = new Set<string>();
    const matches = content.matchAll(regex);

    for (const match of matches) {
        const variableName = match[1];
        if (variableName) {
            variables.add(variableName);
        }
    }

    return [...variables];
}

export function findMissingRequiredVariables(params: {
    subject: string;
    body: string;
    requiredVariables: string[];
}): string[] {
    const usedVariables = new Set(
        extractTemplateVariables(`${params.subject}\n${params.body}`),
    );

    return params.requiredVariables.filter((variableName) => !usedVariables.has(variableName));
}

export function findUnknownVariables(params: {
    subject: string;
    body: string;
    availableVariables: string[];
}): string[] {
    const usedVariables = extractTemplateVariables(`${params.subject}\n${params.body}`);
    const availableVariables = new Set(params.availableVariables);

    return usedVariables.filter((variableName) => !availableVariables.has(variableName));
}

export async function fetchEmailTemplates(spaceId: string): Promise<EmailTemplateCollection> {
    await wait(200);

    const stored = readStoredTemplates(spaceId);
    return {
        welcome_user: normalizeTemplate(stored.welcome_user, DEFAULT_EMAIL_TEMPLATES.welcome_user),
        password_changed: normalizeTemplate(stored.password_changed, DEFAULT_EMAIL_TEMPLATES.password_changed),
    };
}

export async function saveEmailTemplate(params: {
    spaceId: string;
    key: EmailTemplateKey;
    template: EmailTemplateModel;
}): Promise<EmailTemplateModel> {
    await wait(250);

    const stored = readStoredTemplates(params.spaceId);
    stored[params.key] = {
        subject: params.template.subject,
        body: params.template.body,
    };
    writeStoredTemplates(params.spaceId, stored);

    return params.template;
}

export async function previewEmailTemplate(params: {
    key: EmailTemplateKey;
    template: EmailTemplateModel;
    context?: Record<string, string>;
}): Promise<EmailTemplateModel> {
    await wait(200);

    const config = EMAIL_TEMPLATE_CONFIGS[params.key];
    const context = {
        ...config.sampleContext,
        ...(params.context ?? {}),
    };

    return {
        subject: renderTemplateString(params.template.subject, context),
        body: renderTemplateString(params.template.body, context),
    };
}

export async function testSendEmailTemplate(params: {
    key: EmailTemplateKey;
    template: EmailTemplateModel;
    context?: Record<string, string>;
}): Promise<{ recipient: string; messageId: string }> {
    await previewEmailTemplate(params);
    await wait(200);

    return {
        recipient: "test@example.com",
        messageId: `stub-${Date.now()}`,
    };
}
