import {$rooms} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {loaded} from "@/api";
import RoomsTableView from "@/routes/spaces/dashboard/rooms/components/RoomsTableView.tsx";

function RoomsPage() {
    const rooms = useAtomValue($rooms)

    return (
        <>
            <BatchLoader
                states={[rooms]}
                loadingMessage={"Загрузка комнат"}
                display={() =>
                    <div className={"flex flex-col m-6  py-4 ml-6"}>
                        <span className={"text-4xl"}>Комнаты</span>
                        <div>
                            <RoomsTableView users={loaded(rooms).data}></RoomsTableView>
                        </div>
                    </div>
                }
            />
        </>
    );
}

export default RoomsPage
