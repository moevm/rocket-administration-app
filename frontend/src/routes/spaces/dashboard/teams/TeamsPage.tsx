import {$teams} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {BatchLoader} from "@/components/reusableComponents/DataLoader.tsx";
import {loaded} from "@/api";
import TeamsTableView from "@/routes/spaces/dashboard/teams/components/TeamsTableView.tsx";

function TeamsPage() {
    const teams = useAtomValue($teams)

    console.log(teams)
    return (
        <>
            <BatchLoader
                states={[teams]}
                loadingMessage={"Загрузка команд"}
                display={() =>
                    <div className={"flex flex-col m-6  py-4 ml-6"}>
                        <span className={"text-4xl"}>Команды</span>
                        <div>
                            <TeamsTableView users={loaded(teams).data.teams}></TeamsTableView>
                        </div>
                    </div>
                }
            />
        </>
    );
}

export default TeamsPage
