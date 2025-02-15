import {Button} from "@/components/ui/button.tsx";
import {atom, useAtom} from "jotai";

const countAtom = atom(0)

const MainPage = () => {
    const [count, setCount] = useAtom(countAtom)
    return (
        <>
            <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
        </>
    )
}

export default MainPage
