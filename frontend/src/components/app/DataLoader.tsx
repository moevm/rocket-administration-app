import {Loadable} from "jotai/vanilla/utils/loadable";
import * as React from "react";
import {errorMessage} from "@/api";


export const BatchLoader = ({states, loadingMessage, display}: {
    states: Loadable<unknown>[],
    loadingMessage: string,
    display: () => React.ReactNode
}) => {
    const errorState = states.find(it => it.state === 'hasError')
    if (errorState) {
        return (<div>{"Ошибка: " + errorMessage(errorState.error)}</div>)
    }
    const someLoading = states.some(it => it.state === 'loading')
    if (someLoading) {
        return <div>{loadingMessage}</div>
    }
    return <>{display()}</>
}
