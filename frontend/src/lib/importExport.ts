import {toast} from "sonner";
import * as XLSX from "xlsx";
import {stringify} from 'csv-stringify/browser/esm/sync';
import {parse} from 'csv-parse/browser/esm/sync';

function writeJSON(objects: object[]): string {
    return JSON.stringify(objects, null, 2);
}

// Принимаем JSON
function writeXLSX(objects: object[]): string {
    try {
        const worksheet = XLSX.utils.json_to_sheet(objects);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Export");

        return XLSX.write(workbook, {bookType: "xlsx", type: "array"});
    } catch (e) {
        console.error("Ошибка при генерации XLSX:", e);
        toast.error("Ошибка при генерации XLSX");
        return "";
    }
}

function writeCSV(objects: object[]): string {
    if (!objects.length) return "";

    try {
        return stringify(objects, {
            header: true,
        });
    } catch (e) {
        console.error("Ошибка при генерации CSV:", e);
        toast.error("Ошибка при генерации CSV");
        return "";
    }
}

function parseJSON(data: string): object[] {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
        return parsed;
    }
    return [parsed]; // если пришёл один объект — оборачиваем в массив

}

export function detectFormatFromFileName(filename: string): Format | null {
    const ext = filename.split(".").pop()?.toLowerCase();

    switch (ext) {
        case "csv":
            return "CSV";
        case "json":
            return "JSON";
        case "xlsx":
        case "xls":
            return "XLSX";
        default:
            return null;
    }
}

function parseXLSX(data: string | ArrayBuffer): object[] {

    const workbook = XLSX.read(data, {type: "binary"});
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // преобразуем в JSON
    return XLSX.utils.sheet_to_json(worksheet, {defval: ""});

}

function parseCSV(data: string): object[] {

    return parse(data, {
        columns: true,       // преобразуем в массив объектов
        skip_empty_lines: true,
        trim: true,
    });

}

export type Format = 'JSON' | 'XLSX' | 'CSV'

export function exportData(format: Format, exportFile: string) {

    let blob = new Blob([format], {type: "text/plain"});
    let url = "";
    let link = null;
    if (exportFile) {
        try {
            switch (format) {
                case "JSON":
                    console.log(exportFile);
                    blob = new Blob([exportFile], {type: `application/${format.toLowerCase()}`});
                    break;
                case "CSV":
                    blob = new Blob([exportFile], {type: "text/csv;charset=utf-8"});
                    break;
                case "XLSX":
                    blob = new Blob([exportFile], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    });
                    break;
                default:
                    toast.error("Ошибка при загрузке файла.");
                    return null;
            }
            url = URL.createObjectURL(blob);
            link = document.createElement("a");
            link.href = url;
            link.download = `export.${format.toLowerCase()}`;
            link.click();

            URL.revokeObjectURL(url); // очистка
        } catch (e) {
            console.error(e);
            toast.error("Ошибка при загрузке файла");
        }

    }

}

export function writeData(format: Format, data: object[], selectedFields: string[] | null): string {
    const filteredData = data.map(item => {
        if (selectedFields === null) {
            return item
        }
        return selectedFields.reduce((acc, field) => {
            let value = item[field];
            // не уверен, что верное решение, но нормально. Просто вложенность превращаем в строку
            // для excel, например
            if (typeof value === 'object' && value !== null && format === "XLSX") {
                value = JSON.stringify(value);
            }
            acc[field] = value;
            return acc;
        }, {} as Record<string, any>)
    });

    switch (format) {
        case 'JSON':
            return writeJSON(filteredData);
        case 'XLSX':
            return writeXLSX(filteredData);
        case 'CSV':
            return writeCSV(filteredData);
        default:
            toast.error(`Неподдерживаемый формат ${format}`);
            throw new Error(`Неподдерживаемый формат ${format}`);
    }
}

export function parseData(format: Format, data: string): object[] {
    switch (format) {
        case 'JSON':
            return parseJSON(data);
        case 'XLSX':
            return parseXLSX(data);
        case 'CSV':
            return parseCSV(data);
        default:
            toast.error(`Неподдерживаемый формат ${format}`);
            throw new Error(`Неподдерживаемый формат ${format}`);
    }
}
