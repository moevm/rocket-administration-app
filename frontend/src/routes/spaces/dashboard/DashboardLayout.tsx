import {Outlet, useOutletContext} from "react-router";
import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import AppSidebar from "@/routes/spaces/dashboard/components/AppSidebar";
import {ApiSpaceModel} from "@/store/global-store.ts";
import AddUserInRoomDialog from "@/components/app/dialogs/user-page-dialogs/AddUserInRoomDialog.tsx";

import PasswordChangeDialog from "@/components/app/dialogs/user-page-dialogs/PasswordChangeDialog.tsx";
import AddNewTeamDialog from "@/components/app/dialogs/AddNewTeamDialog.tsx";
import AddUserInTeamDialog from "@/components/app/dialogs/user-page-dialogs/AddUserInTeamDialog.tsx";
import DeleteUserFromRoomDialog from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromRoomDialog.tsx";
import DeleteUserFromTeamDialog from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromTeamDialog.tsx";
import DeleteUserDialog from "@/components/app/dialogs/user-page-dialogs/DeleteUserDialog.tsx";
import AddRoomsToUsersDialog from "@/components/app/dialogs/room-page-dialogs/AddRoomsToUsersDialog.tsx";
import DeleteUsersOutOfRoomDialog from "@/components/app/dialogs/room-page-dialogs/DeleteUsersOutOfRoomsDialog.tsx";
import AddTeamsToRoomsDialog from "@/components/app/dialogs/room-page-dialogs/AddTeamsToRoomsDialog.tsx";
import DeleteTeamsOutOfRoomsDialog from "@/components/app/dialogs/room-page-dialogs/DeleteTeamsOutOfRoomsDialog.tsx";
import HideRoomDialog from "@/components/app/dialogs/room-page-dialogs/HideRoomDialog.tsx";
import DeleteRoomDialog from "@/components/app/dialogs/room-page-dialogs/DeleteRoomDialog.tsx";
import AddUsersToTeamDialog from "@/components/app/dialogs/team-page-dialogs/AddUsersToTeamDialog.tsx";
import DeleteUsersOutOfTeamDialog from "@/components/app/dialogs/team-page-dialogs/DeleteUsersOutOfTeamDialog.tsx";
import AddTeamIntoRoomDialog from "@/components/app/dialogs/team-page-dialogs/AddTeamIntoRoomDialog.tsx";
import DeleteTeamFromRoomDialog from "@/components/app/dialogs/team-page-dialogs/DeleteTeamFromRoomDialog.tsx";
import DeleteTeamDialog from "@/components/app/dialogs/team-page-dialogs/DeleteTeamDialog.tsx";
import AddNewUserDialog from "@/components/app/dialogs/AddNewUserDialog.tsx";
import AddNewRoomDialog from "@/components/app/dialogs/AddNewRoomDialog.tsx";

function DashboardLayout() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[],
        selectedSpace: ApiSpaceModel
    }>()
    return (
        <>
            <AddUserInRoomDialog/>
            <PasswordChangeDialog/>
            <AddUserInTeamDialog/>
            <DeleteUserFromRoomDialog/>
            <DeleteUserFromTeamDialog/>
            <DeleteUserDialog/>

            <AddRoomsToUsersDialog/>
            <DeleteUsersOutOfRoomDialog/>
            <AddTeamsToRoomsDialog/>
            <DeleteTeamsOutOfRoomsDialog/>
            <HideRoomDialog/>
            <DeleteRoomDialog/>

            <AddUsersToTeamDialog/>
            <DeleteUsersOutOfTeamDialog/>
            <AddTeamIntoRoomDialog/>
            <DeleteTeamFromRoomDialog/>
            <DeleteTeamDialog/>

            <AddNewTeamDialog/>
            <AddNewUserDialog/>
            <AddNewRoomDialog/>

            <div>
                <SidebarProvider>
                    <AppSidebar spaces={context.spaces} selectedSpace={context.selectedSpace}/>
                    <main className="min-w-0 flex-grow">
                        <Outlet context={context}/>
                    </main>
                </SidebarProvider>
            </div>
        </>
    );
}

export default DashboardLayout
