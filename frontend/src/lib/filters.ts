import {ColumnType} from "@/lib/table.ts";
import {z} from "zod";
import dayjs, {isDayjs} from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';

export const relationFullName = {
    'includes': "включает",
    'not-includes': "не включает",
    'equals': "соответствует",
    'not-equals': "не соответствует",
    'eq': "равно",
    'not-eq': "не равно",
    'gt': "больше, чем",
    'lt': "меньше, чем",
    'ge': "больше или равно",
    'le': "меньше или равно",
    'list-includes': 'содержит',
    'list-not-includes': 'не содержит',
    'positive': 'истинно',
    'negative': 'ложно',
    'datetime-before': 'до',
    'datetime-after': 'после',
    'empty': 'не указано',
    'not-empty': 'указано'
} as const

export type RelationType = keyof typeof relationFullName;

export function getColumnTypeRelations(type: ColumnType): RelationType[] {
    switch (type) {
        case 'string':
            return ['includes', 'not-includes', 'equals', 'not-equals', 'empty', 'not-empty']
        case 'number':
            return ['eq', 'not-eq', 'gt', 'lt', 'ge', 'le', 'empty', 'not-empty']
        case 'list':
            return ['list-includes', 'list-not-includes', 'empty', 'not-empty']
        case 'boolean':
            return ['positive', 'negative', 'empty', 'not-empty']
        case 'datetime':
            return ['datetime-before', 'datetime-after', 'empty', 'not-empty']
        default:
            return ['empty', 'not-empty']
    }
}

export function getRelationArgs(relation: RelationType) {
    switch (relation) {
        case 'includes':
        case 'not-includes':
        case 'equals':
        case 'not-equals':
        case "list-includes":
        case 'list-not-includes':
            return {
                schema: z.object({
                    value: z.string(),
                }),
                fields: [
                    {key: 'value', label: 'Значение'}
                ]
            }
        case 'eq':
        case 'not-eq':
        case 'gt':
        case 'lt':
        case 'ge':
        case 'le':
            return {
                schema: z.object({
                    value: z.coerce.number(),
                }),
                fields: [
                    {key: 'value', label: 'Значение'}
                ]
            }
        case "negative":
        case "positive":
        case "empty":
        case 'not-empty':
            return {
                schema: z.object({}),
                fields: []
            }
        case "datetime-after":
        case "datetime-before":
            return {
                schema: z.object({
                    value: z.coerce.date(),
                }),
                fields: [
                    {key: 'value', label: 'Значение'}
                ]
            }
    }
}

export interface FilterConfig {
    columnId: string,
    relation: RelationType,
    values: object
}

export function performFilter(filter: FilterConfig, value: any) {
    // console.info(
    //     value.map(it => JSON.stringify(it).toLowerCase()),
    //     String(filter.values['value']).toLowerCase(),
    //     value.some(it => JSON.stringify(it).toLowerCase() === JSON.stringify(filter.values['value']).toLowerCase())
    // )

    dayjs.extend(customParseFormat);
    const valueExists =
        value !== undefined &&
        value !== null &&
        !(typeof value === 'string' && (value.trim() === '' || value === '–' || value === '-')) &&
        !(Array.isArray(value) && value.length === 0) &&
        (!isDayjs(value) || dayjs(value, 'DD.MM.YYYY HH:mm').isValid());

    console.log(valueExists, value);
    //console.log( value.toDate().toString(), dayjs(value, 'DD.MM.YYYY HH:mm').isValid())

    switch (filter.relation) {
        case 'includes':
            return valueExists && String(value).toLowerCase().includes(String(filter.values['value']).toLowerCase())
        case 'not-includes':
            return !valueExists || !String(value).toLowerCase().includes(String(filter.values['value']).toLowerCase())
        case 'equals':
            return valueExists && String(value).toLowerCase() === String(filter.values['value']).toLowerCase()
        case 'not-equals':
            return !valueExists || String(value).toLowerCase() !== String(filter.values['value']).toLowerCase()
        case "list-includes":
            return valueExists && value.some(it => JSON.stringify(it).toLowerCase() === JSON.stringify(filter.values['value']).toLowerCase())
        case 'list-not-includes':
            return !valueExists || !value.some(it => JSON.stringify(it).toLowerCase() === JSON.stringify(filter.values['value']).toLowerCase())
        case 'eq':
            return valueExists && Number(value) === Number(filter.values['value'])
        case 'not-eq':
            return !valueExists || Number(value) !== Number(filter.values['value'])
        case 'gt':
            return valueExists && Number(value) > Number(filter.values['value'])
        case 'lt':
            return valueExists && Number(value) < Number(filter.values['value'])
        case 'ge':
            return valueExists && Number(value) >= Number(filter.values['value'])
        case 'le':
            return valueExists && Number(value) <= Number(filter.values['value'])
        case "negative":
            return valueExists && !value
        case "positive":
            return valueExists && !!value
        case "datetime-after": {
            if (!valueExists) return false;

            const val = dayjs(value);
            const target = dayjs(filter.values['value']);

            return val.isAfter(target);
        }
        case "datetime-before": {
            if (!valueExists) return false;

            const val = dayjs(value);
            const target = dayjs(filter.values['value']);

            return val.isBefore(target);
        }
        case "empty":
            return !valueExists
        case "not-empty":
            return valueExists
    }
}
