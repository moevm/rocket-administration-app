
export interface User {
    _id: string,
    name: string,
    username: string,
    emails: { address: string; verified: boolean }[];
    status: string,
    roles: string[]
}