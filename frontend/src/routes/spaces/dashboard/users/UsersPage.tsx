import { useOutletContext } from "react-router";
import { ApiSpaceModel } from "@/store/spaces.ts";
import { Label } from "@/components/ui/label.tsx";
import { columnsUser } from "@/store/columnsUser.tsx";
import { useEffect, useState } from "react";
import { User } from "@/store/types/user.ts";
import TableData from "@/routes/spaces/dashboard/users/Components/TableData.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

function UsersPage() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[];
        selectedSpace: ApiSpaceModel;
    }>();

    // Состояния для данных, загрузки и ошибок
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // URL для запроса
    const url = "http://127.0.0.1:8000/spaces/67c8c354eb0df5079068c22d/users";

    // TODO: ЭТО ОЧЕНЬ ВРЕМЕННЫЙ ВАРИАНТ ДЛЯ ТЕСТА НАДО ВСЕ В АТОМ ПЕРЕВЕСТИ
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(url);

                // Проверка, что ответ успешный (статус 200-299)
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                // Парсинг ответа в формате JSON
                const data = await response.json();

                // Предполагаем, что данные соответствуют типу User[]
                setUsers(data);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Ошибка при загрузке данных");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url]);

    console.log(users)

    if (loading) {
        return <Skeleton />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className={"flex flex-col m-6 h-screen max-w-screen-lg w-screen py-4 ml-4"}>
            <span className={"text-4xl"}>Пользователи</span>
            <div>
                <TableData columns={columnsUser} data={users?.users} />
            </div>
        </div>
    );
}

export default UsersPage;