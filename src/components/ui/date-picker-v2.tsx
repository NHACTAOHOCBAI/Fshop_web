
"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DatePickerV2Props = {
    date?: Date
    onChange: (date: Date | undefined) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}

function DatePickerV2({
    date,
    onChange,
    disabled,
    placeholder = "Pick a date",
    className,
}: DatePickerV2Props) {

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    data-empty={!date}
                    className={cn(
                        "w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onChange}
                    defaultMonth={date}
                />
            </PopoverContent>
        </Popover>
    )
}
export default DatePickerV2