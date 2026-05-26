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

const TOKEN_PATTERN = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;
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

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function fetchEmailTemplates(spaceId: string): Promise<EmailTemplateCollection> {
    const response = await fetch(`${API_BASE_URL}/spaces/${spaceId}/settings/email-templates`, {
        credentials: 'include',
    });

    if (!response.ok) {
        console.error(`Failed to fetch templates: ${response.status}`);
        return DEFAULT_EMAIL_TEMPLATES;
    }

    const data = await response.json();
    return {
        welcome_user: data.welcome_user || DEFAULT_EMAIL_TEMPLATES.welcome_user,
        password_changed: data.password_changed || DEFAULT_EMAIL_TEMPLATES.password_changed,
    };
}

export async function saveEmailTemplate(params: {
    spaceId: string;
    key: EmailTemplateKey;
    template: EmailTemplateModel;
}): Promise<EmailTemplateModel> {
    const response = await fetch(`${API_BASE_URL}/spaces/${params.spaceId}/settings/email-templates/${params.key}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            subject: params.template.subject,
            body: params.template.body,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`Save failed: ${response.status}`, text);
        throw new Error(`Failed to save template: ${response.status}`);
    }

    return await response.json();
}

export async function previewEmailTemplate(params: {
    key: EmailTemplateKey;
    template: EmailTemplateModel;
    context?: Record<string, string>;
}): Promise<EmailTemplateModel> {
    const spaceId = window.location.pathname.split('/')[2];

    const response = await fetch(`${API_BASE_URL}/spaces/${spaceId}/settings/email-templates/preview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            template: {
                subject: params.template.subject,
                body: params.template.body,
            },
            context: params.context || {},
        }),
    });

    if (!response.ok) {
        const config = EMAIL_TEMPLATE_CONFIGS[params.key];
        const context = {
            ...config.sampleContext,
            ...(params.context ?? {}),
        };

        return {
            subject: params.template.subject.replace(TOKEN_PATTERN, (_, varName) => context[varName] || `{{${varName}}}`),
            body: params.template.body.replace(TOKEN_PATTERN, (_, varName) => context[varName] || `{{${varName}}}`),
        };
    }

    return await response.json();
}

export async function testSendEmailTemplate(params: {
    key: EmailTemplateKey;
    template: EmailTemplateModel;
    context?: Record<string, string>;
}): Promise<{ recipient: string; messageId: string }> {
    const spaceId = window.location.pathname.split('/')[2];

    const response = await fetch(`/spaces/${spaceId}/settings/email-templates/test-send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            template: {
                subject: params.template.subject,
                body: params.template.body,
            },
            context: params.context || {},
            to: "test@example.com",
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to send test email: ${response.statusText}`);
    }

    return await response.json();
}
