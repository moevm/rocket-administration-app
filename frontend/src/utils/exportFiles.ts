import {toast} from "sonner";

function writeJSON(objects: object[]): string {
    return JSON.stringify(objects, null, 2);
}
function writeXLSX(objects: object[]): string {
    return "";
}
function writeCSV(objects: object[]): string {
    return "";
}

function parseJSON(data: string): object[] {
    try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [parsed]; // если пришёл один объект — оборачиваем в массив
    } catch (e) {
        console.error("Некорректный JSON:", e);
        toast.error("Некорректный JSON");
        return [];
    }
}
function parseXLSX(data: string): string[] {
    return JSON.parse(data);
}
function parseCSV(data: string): string[] {
    return JSON.parse(data);
}

export type Format = 'JSON' | 'XLSX' | 'CSV'

export function exportData(format: Format, exportFile: string) {
    // switch (format) {
    //     case 'JSON':
    //         break;
    //     case 'XLSX':
    //         break;
    //     case 'CSV':
    //         break;
    //     default:
    //         toast.error("Неподдерживаемый формат");
    //         throw new Error("Неподдерживаемый формат");
    // }

    if(exportFile) {
        console.log(exportFile);
        const blob = new Blob([exportFile], {type: `application/${format.toLowerCase()}`});
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `export.${format.toLowerCase()}`;
        link.click();

        URL.revokeObjectURL(url); // очистка
    }

}

export function writeData(format: Format, data: object[], selectedFields: string[]): string {
    const filteredData = data.map(item =>
        selectedFields.reduce((acc, field) => {
            acc[field] = item[field];
            return acc;
        }, {} as Record<string, any>)
    );

    switch (format) {
        case 'JSON':
            return writeJSON(filteredData);
        case 'XLSX':
            return writeXLSX(filteredData);
        case 'CSV':
            return writeCSV(filteredData);
        default:
            toast.error("Неподдерживаемый формат");
            throw new Error("Неподдерживаемый формат");
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
            toast.error("Неподдерживаемый формат");
            throw new Error("Неподдерживаемый формат");
    }
}