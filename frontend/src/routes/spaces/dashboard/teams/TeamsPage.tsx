import {$teams, showAddNewTeamDialogAtom} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {loaded} from "@/api";
import TeamsTableView from "@/routes/spaces/dashboard/teams/components/TeamsTableView.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";

function TeamsPage() {
    const teams = useAtomValue($teams)

    return (
        <>
            <BatchLoader
                states={[teams]}
                loadingMessage={"Загрузка команд"}
                display={() =>
                    <div className={"flex flex-col m-6  py-4 ml-6"}>
                        <span className={"text-4xl"}>Команды</span>

                        <div>
                            <TeamsTableView data={loaded(teams).data}></TeamsTableView>
                        </div>
                    </div>
                }
            />
        </>
    );
}

export default TeamsPage
