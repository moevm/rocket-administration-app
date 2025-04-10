import {
    ContextMenuProps,
    ContextMenuProvider,
    Point,
    ScopedProps,
    useMenuScope
} from "@/components/custom-radix/context-menu.tsx";
import {useCallbackRef} from "@radix-ui/react-use-callback-ref";
import * as React from "react";
import {useEffect} from "react";
import * as MenuPrimitive from "@radix-ui/react-menu";
import {ContextMenuContent} from "@/components/ui/context-menu.tsx";

const ExternallyTriggeredContextMenu = (props: ScopedProps<ContextMenuProps & {open: boolean, point: Point}>) => {
    const { __scopeContextMenu, children, onOpenChange, dir, modal = true, open } = props;
    const menuScope = useMenuScope(__scopeContextMenu);
    const handleOpenChangeProp = useCallbackRef(onOpenChange);

    const handleOpenChange = React.useCallback(
        (open: boolean) => {
            handleOpenChangeProp(open);
        },
        [handleOpenChangeProp]
    );

    const point = React.useRef<Point>({x: 0, y: 0})
    const virtualRef = React.useRef({
        getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, ...point.current }),
    });

    useEffect(() => {
        point.current = props.point
    }, [props.point]);

    return (
        <ContextMenuProvider
            scope={__scopeContextMenu}
            open={open}
            onOpenChange={handleOpenChange}
            modal={modal}
        >
            <MenuPrimitive.Root
                {...menuScope}
                dir={dir}
                open={open}
                onOpenChange={handleOpenChange}
                modal={modal}
            >
                <ContextMenuContent>
                    <MenuPrimitive.Anchor {...menuScope} virtualRef={virtualRef} />
                    {children}
                </ContextMenuContent>
            </MenuPrimitive.Root>
        </ContextMenuProvider>
    );
}

export default ExternallyTriggeredContextMenu