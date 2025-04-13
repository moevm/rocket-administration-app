import {Card, CardContent} from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {ReactNode} from "react";

function EntityCard(props: {
    items: [ReactNode, ReactNode][]
}) {
    return (
        <Card>
            <CardContent className="grid grid-cols-2 gap-2 py-4">

                    {props.items.map(item => (
                        <>
                            <Label className={"text-foreground/50"}>{item[0]}</Label>
                            <Label>{item[1]}</Label>
                        </>
                    ))}

            </CardContent>
        </Card>
    )
}

export default EntityCard;
