import {atom} from "jotai";

export interface ApiShortSpace {
    id: number
    name: string
}

export const $spaces = atom<ApiShortSpace[]>([
    {
        id: 0,
        name: 'Test space 1'
    },
    {
        id: 1,
        name: 'Test space 2'
    },
    {
        id: 2,
        name: 'Test space 3'
    }
])

export const $selectedSpaceId = atom<number>(0)

export const $selectedSpace = atom<ApiShortSpace>((get) => {
    return get($spaces)[get($selectedSpaceId)]
})

