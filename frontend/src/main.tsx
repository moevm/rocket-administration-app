import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes} from "react-router";
import MainPage from "@/routes/MainPage.tsx";
import DashboardLayout from "@/routes/dashboard/DashboardLayout.tsx";
import {useAtomValue} from "jotai";
import {$selectedSpaceId} from "@/routes/global-store.ts";
import SpaceLayout from "@/routes/spaces/SpaceLayout.tsx";
import UsersPage from "@/routes/users/UsersPage.tsx";
import RoomsPage from "@/routes/rooms/RoomsPage.tsx";
import NotificationsPage from "@/routes/notifications/NotificationsPage.tsx";


createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route path={`spaces/:spaceId`} element={<SpaceLayout/>}>
                <Route path="dashboard" element={<DashboardLayout/>}>
                    <Route path="users" element={<UsersPage/>}/>
                    <Route path="rooms" element={<RoomsPage/>}/>
                    <Route path="notifications" element={<NotificationsPage/>}/>
                </Route>
            </Route>
        </Routes>
    </BrowserRouter>
)
