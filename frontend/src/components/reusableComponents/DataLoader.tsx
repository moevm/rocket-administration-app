import {Loadable} from "jotai/vanilla/utils/loadable";
import * as React from "react";

export const DataLoader = <T, >({state, loadingMessage, display}: {
    state: Loadable<T>,
    loadingMessage: string,
    display: (data: Awaited<T>) => React.ReactNode
}) => {
    if (state.state === 'hasError') {
        return (<div>{"Ошибка: " + String(state.error)}</div>)
    }
    if (state.state === 'loading') {
        return <div>{loadingMessage}</div>
    }
    return <>{display(state.data)}</>
};

export const BulkLoader = ({states, loadingMessage, display}: {
    states: Loadable<unknown>[],
    loadingMessage: string,
    display: () => React.ReactNode
}) => {
    const errorState = states.find(it => it.state === 'hasError')
    if (errorState) {
        return (<div>{"Ошибка: " + String(errorState.error)}</div>)
    }
    const someLoading = states.some(it => it.state === 'loading')
    if (someLoading) {
        return <div>{loadingMessage}</div>
    }
    return  <>{display()}</>
}
