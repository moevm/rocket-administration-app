import {useOutletContext} from "react-router";
import {ApiSpaceModel} from "@/store/spaces.ts";
import {Label} from "@/components/ui/label.tsx";
import {columnsUser} from "@/store/columnsUser.tsx";
import {useState} from "react";
import {User} from "@/store/types/user.ts";
import TableData from "@/routes/spaces/dashboard/users/Components/TableData.tsx";

function UsersPage() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[],
        selectedSpace: ApiSpaceModel
    }>()

    // TODO: useEffect loading error итд
    // TODO: fetching

    const [users, setUsers] = useState<User[]>([
        {
            id: "2312",
            email: "test@test.tes",
            nickname: "test",
            status: "statusTest",
            roles: [
                "role1",
                "role2"
                ]
        }
    ]);


    return (
        <div>
            {JSON.stringify(context)} users
            <Label className={"text-primary"}>Пользователи</Label>
            <div>
                <TableData columns={columnsUser} data={users}/>
            </div>
        </div>
    )
}

export default UsersPage
