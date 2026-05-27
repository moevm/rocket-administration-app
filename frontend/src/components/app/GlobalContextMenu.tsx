import {useAtom, useAtomValue} from "jotai";
import ExternallyTriggeredContextMenu from "@/components/app/ExternallyTriggeredContextMenu.tsx";
import {ContextMenuLabel} from "@/components/ui/context-menu.tsx";
import {contextMenuDataAtom, showContextMenuAtom} from "@/store/global-store.ts";

export default function GlobalContextMenu() {
    const [contextMenuOpen, setContextMenuOpen] = useAtom(showContextMenuAtom);
    const contextMenuData = useAtomValue(contextMenuDataAtom);

    if (!contextMenuData.config) {
        return null;
    }

    const rows = Array.isArray(contextMenuData.rows) ? contextMenuData.rows : [];

    return (
        <ExternallyTriggeredContextMenu
            open={contextMenuOpen}
            onOpenChange={setContextMenuOpen}
            point={contextMenuData.point}
        >
            <ContextMenuLabel>
                {contextMenuData.config.getLabel
                    ? contextMenuData.config.getLabel(rows)
                    : "Действия"}
            </ContextMenuLabel>
            {rows.length > 0 ? contextMenuData.config.items(rows) : null}
        </ExternallyTriggeredContextMenu>
    );
}
