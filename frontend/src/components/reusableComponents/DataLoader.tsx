import {Loadable} from "jotai/vanilla/utils/loadable";
import * as React from "react";

const DataLoader =  <T,>({state, loadingMessage, display}: {
    state: Loadable<T>,
    loadingMessage: String,
    display: (data: T) => React.ReactNode
}) => {
    if (state.state === 'hasError') {
        return (<div>{"Ошибка: " + String(state.error)}</div>)
    }
    if (state.state === 'loading') {
        return <div>{loadingMessage}</div>
    }
    if (state.state === 'hasData') {
        return <>{display(state.data)}</>
    }
};

export default DataLoader;
