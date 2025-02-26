import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import DashboardLayout from "@/routes/spaces/dashboard/DashboardLayout.tsx";
import SpaceLayout from "@/routes/spaces/SpaceLayout.tsx";
import UsersPage from "@/routes/spaces/dashboard/users/UsersPage.tsx";
import RoomsPage from "@/routes/spaces/dashboard/rooms/RoomsPage.tsx";
import NotificationsPage from "@/routes/spaces/dashboard/notifications/NotificationsPage.tsx";
import NotFound from "@/routes/not-found/NotFound.tsx";
import RegisterSpace from "@/routes/register-space/RegisterSpace.tsx";
import i18next from "i18next";
import {z} from "zod";
import {zodI18nMap} from "zod-i18n-map";
import translation from "zod-i18n-map/locales/ru/zod.json";
import WelcomePage from "@/routes/welcome-page/WelcomePage.tsx";

i18next.init({
    lng: "ru",
    resources: {
        ru: {zod: translation},
    },
});
z.setErrorMap(zodI18nMap);

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route path="welcome" element={<WelcomePage/>}/>
            <Route path="spaces/:spaceId" element={<Navigate relative="path" to="dashboard" replace/>}/>
            <Route path="spaces/:spaceId" element={<SpaceLayout/>}>
                <Route path="dashboard" element={<Navigate relative="path" to="users" replace/>}/>
                <Route path="dashboard" element={<DashboardLayout/>}>
                    <Route path="users" element={<UsersPage/>}/>
                    <Route path="rooms" element={<RoomsPage/>}/>
                    <Route path="notifications" element={<NotificationsPage/>}/>
                </Route>
            </Route>
            <Route path="register-space" element={<RegisterSpace/>}/>
            <Route path="*" element={<NotFound/>}/>
        </Routes>
    </BrowserRouter>
)
