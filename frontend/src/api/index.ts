import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import {paths} from "@/schema";
import {QueryClient} from '@tanstack/react-query'
import {useHydrateAtoms} from "jotai/react/utils";
import {queryClientAtom} from 'jotai-tanstack-query'
import {ReactNode} from "react";
import type {Atom} from "jotai/vanilla";
import {loadable} from "jotai/utils";
import {AtomWithQueryResult} from "jotai-tanstack-query"
import {atom} from "jotai";
import {Loadable} from "jotai/vanilla/utils/loadable";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            experimental_prefetchInRender: true,
        },
    },
})

export const HydrateAtoms = ({ children }: { children: ReactNode }) => {
    // @ts-ignore
    useHydrateAtoms(new Map([[queryClientAtom, queryClient]]))
    return children
}

const fetchClient = createFetchClient<paths>({
    baseUrl: "http://localhost:8000",
});
export const $api = createClient(fetchClient);

export function loadableQuery<Value>(anAtom: Atom<AtomWithQueryResult<Awaited<Value>>>): Atom<Loadable<Value>> {
    return loadable(atom(async (get) => {
        return await get(anAtom).promise
    }))
}

// TODO show loader & toast
export function createMutationOptions<D, E, I>(options?: Omit<UseMutationOptions<D, E, I>, "mutationKey" | "mutationFn">): Omit<UseMutationOptions<D, E, I>, "mutationKey" | "mutationFn"> {
    return {
        onMutate: (variables) => {
            console.log('about to mutate', {variables})
            if (options?.onMutate) options.onMutate(variables)
        },
        onError: (error, variables, context) => {
            console.log(`mutation error`, {error, variables, context})
            if (options?.onError) options.onError(error, variables, context)
        },
        onSuccess: (data, variables, context) => {
            console.log('mutation success', {data, variables, context})
            if (options?.onSuccess) options.onSuccess(data, variables, context)
        },
    }
}
