import {$roles, $users} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {BatchLoader} from "@/components/reusableComponents/DataLoader.tsx";
import UserTableView from "@/routes/spaces/dashboard/users/Components/UserTableView.tsx";
import {loaded} from "@/api";

function UsersPage() {
    const users = useAtomValue($users)
    const roles = useAtomValue($roles)

    console.log(users)
    return (
        <>
            <BatchLoader
                states={[users, roles]}
                loadingMessage={"Загрузка пользователей"}
                display={() =>
                    <div className={"flex flex-col m-6  py-4 ml-6"}>
                        <span className={"text-4xl"}>Пользователи</span>
                        <div>
                            <UserTableView users={loaded(users).data.users}></UserTableView>
                        </div>
                    </div>
                }
            />
        </>
    );
}

export default UsersPage;
