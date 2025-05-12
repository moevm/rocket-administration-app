export interface BatchResultProps {
    countedValues: { key: string, display: string }[],
    data: object[]
}

export const BatchResult = (props: BatchResultProps) => {
    return <div>
        <span>(Этот интерфейс будет переработан и будет удобным)</span>
        {
            props.countedValues.map(value => {
                let count = 0
                for (let datum of props.data) {
                    if (datum[value.key]) {
                        count++
                    }
                }
                return (<div>{value.display}: {count}/{props.data.length}</div>)
            })
        }
    </div>
}
