import {useOutletContext} from "react-router";
import {columnsUser} from "@/store/columnsUser.tsx";
import TableData from "@/routes/spaces/dashboard/users/Components/TableData.tsx";
import {$users, ApiSpaceModel} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import DataLoader from "@/components/reusableComponents/DataLoader.tsx";

function UsersPage() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[];
        selectedSpace: ApiSpaceModel;
    }>();
    const users = useAtomValue($users)

    console.log(users)
    return (
        <>
            <DataLoader
                state={users}
                loadingMessage={"Загрузка пользователей"}
                display={(data) =>
                    <div className={"flex flex-col m-6 h-screen max-w-screen-lg w-screen py-4 ml-4"}>
                        <span className={"text-4xl"}>Пользователи</span>
                        <div>
                            <TableData columns={columnsUser} data={data.users}/>
                        </div>
                    </div>
                }
            />
        </>
    );
}

export default UsersPage;