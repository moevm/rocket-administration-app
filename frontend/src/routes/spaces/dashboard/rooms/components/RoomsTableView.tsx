import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { Row } from "@tanstack/react-table";
import { toast } from "sonner";

import RichTableView from "@/components/app/table/RichTableView.tsx";
import { columnsRoom } from "@/components/app/columns/columnsRoom.tsx";
import {
  $selectedSpaceId,
  ApiRoomModel,
  showAddNewRoomDialogAtom,
} from "@/store/global-store.ts";
import { roomContextMenuConfig } from "@/components/app/ContextMenuConfigs.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { $api, createMutationOptions } from "@/api";
import { useInvalidateRooms } from "@/api/invalidate";

interface RoomsTableViewProps {
  data: ApiRoomModel[];
  onArchiveSuccess?: () => void;
}

function RoomsTableView({ data, onArchiveSuccess }: RoomsTableViewProps) {
  const navigate = useNavigate();
  const selectedSpaceId = useAtomValue($selectedSpaceId);
  const setAddNewRoomDialogOpen = useSetAtom(showAddNewRoomDialogAtom);
  const invalidateRooms = useInvalidateRooms();

  const [tableKey, setTableKey] = useState(Date.now());

  const sortedData = useMemo(
    () => [...data].sort((a, b) => (a.archived ? 1 : 0) - (b.archived ? 1 : 0)),
    [data]
  );

  const { mutate: archiveRooms, isPending: isArchiving } = $api.useMutation(
    "post",
    "/spaces/{space_id}/rooms/archive/",
    createMutationOptions({})
  );

  const { mutate: unarchiveRooms, isPending: isUnarchiving } = $api.useMutation(
    "post",
    "/spaces/{space_id}/rooms/unarchive/",
    createMutationOptions({})
  );

  const handleArchive = useCallback((roomIds: string[]) => {
    if (roomIds.length === 0) return;

    archiveRooms(
      {
        params: { path: { space_id: selectedSpaceId! } },
        body: { rooms: roomIds },
      },
      {
        onSuccess: (data) => {
          let error: string | null = null;
          if (!(Array.isArray(data) && data.length === 1)) {
            error = "Непредвиденная ошибка";
          } else if (data[0].error) {
            error = data[0].error;
          }
          if (error) {
            toast.error(error);
          } else {
            toast.success(`Комнаты (${roomIds.length}) отправлены в архив`);
            invalidateRooms();
            setTableKey(Date.now());
            onArchiveSuccess?.();
          }
        },
        onError: () => {
          toast.error("Не удалось архивировать комнаты");
        },
      }
    );
  }, [selectedSpaceId, archiveRooms, invalidateRooms, onArchiveSuccess]);

  const handleUnarchive = useCallback((roomIds: string[]) => {
    if (roomIds.length === 0) return;

    unarchiveRooms(
      {
        params: { path: { space_id: selectedSpaceId! } },
        body: { rooms: roomIds },
      },
      {
        onSuccess: (data) => {
          let error: string | null = null;
          if (!(Array.isArray(data) && data.length === 1)) {
            error = "Непредвиденная ошибка";
          } else if (data[0].error) {
            error = data[0].error;
          }
          if (error) {
            toast.error(error);
          } else {
            toast.success(`Комнаты (${roomIds.length}) извлечены из архива`);
            invalidateRooms();
            setTableKey(Date.now());
            onArchiveSuccess?.();
          }
        },
        onError: () => {
          toast.error("Не удалось извлечь комнаты из архива");
        },
      }
    );
  }, [selectedSpaceId, unarchiveRooms, invalidateRooms, onArchiveSuccess]);

  const extendedContextMenuConfig = useMemo(() => {
    const baseConfig = roomContextMenuConfig;

    const extendedItems = (rows: Row<ApiRoomModel>[]) => {
      const originalItems = baseConfig.items(rows);
      const itemsArray = React.Children.toArray(originalItems);
      const roomIds = rows.map((r) => r.original._id as string);

      return (
        <>
          {itemsArray}
          <ContextMenuSub>
            <ContextMenuSubTrigger>Архивация</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                onClick={() => handleArchive(roomIds)}
                disabled={roomIds.length === 0 || isArchiving}
              >
                Архивировать
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleUnarchive(roomIds)}
                disabled={roomIds.length === 0 || isUnarchiving}
              >
                Извлечь из архива
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </>
      );
    };

    return {
      getLabel: baseConfig.getLabel,
      items: extendedItems,
    };
  }, [roomContextMenuConfig, isArchiving, isUnarchiving, handleArchive, handleUnarchive]);

  return (
    <RichTableView
      key={tableKey}
      tableId="rooms"
      entries={sortedData}
      tableConfig={{ columns: columnsRoom }}
      contextMenuConfig={extendedContextMenuConfig}
      settings={{
        enableSearch: true,
        enableExport: true,
        enableColumnVisibilityToggle: true,
        rowClickHandler: (room) =>
          navigate(`/spaces/${selectedSpaceId}/dashboard/rooms/${room._id}`),
      }}
      buttonsSlot={() => (
        <div className="flex justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddNewRoomDialogOpen(true)}
          >
            Создать комнату
          </Button>
        </div>
      )}
    />
  );
}

export default RoomsTableView;