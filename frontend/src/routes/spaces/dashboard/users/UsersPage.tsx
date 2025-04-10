import {useOutletContext} from "react-router";
import {columnsUser} from "@/store/columnsUser.tsx";
import TableData from "@/routes/spaces/dashboard/users/Components/TableData.tsx";
import {$roles, $users} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {BulkLoader} from "@/components/reusableComponents/DataLoader.tsx";
import {loaded} from "@/api";

function UsersPage() {
    const users = useAtomValue($users)
    const roles = useAtomValue($roles)

    console.log(users)
    return (
        <>
            <BulkLoader
                states={[users, roles]}
                loadingMessage={"Загрузка пользователей"}
                display={() =>
                    <div className={"flex flex-col m-6 h-screen max-w-screen-lg w-screen py-4 ml-4"}>
                        <span className={"text-4xl"}>Пользователи</span>
                        <div>
                            <TableData columns={columnsUser} data={loaded(users).data.users}/>
                        </div>
                    </div>
                }
            />
        </>
    );
}

export default UsersPage;
