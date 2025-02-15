import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Route, Routes} from "react-router";
import MainPage from "@/routes/MainPage.tsx";
import DashboardLayout from "@/routes/DashboardLayout.tsx";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route index element={<MainPage />}/>
            <Route path={"dashboard"} element={<DashboardLayout />}/>
        </Routes>
    </BrowserRouter>
)
