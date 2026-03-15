import { CalendarIcon, Clock3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateTimePickerProps = {
    value?: Date
    onChange: (value: Date | undefined) => void
    disabled?: boolean
    placeholder?: string
}

const formatDateTime = (value: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value)
}

const parseTime = (value: string) => {
    const [hour, minute] = value.split(":").map(Number)
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return { hour: 0, minute: 0 }
    }

    return { hour, minute }
}

function DateTimePicker({ value, onChange, disabled, placeholder }: DateTimePickerProps) {
    const selectedTime = value
        ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
        : "00:00"

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <span>{value ? formatDateTime(value) : placeholder ?? "Chọn ngày giờ"}</span>
                    <CalendarIcon className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(selectedDate) => {
                        if (!selectedDate) {
                            onChange(undefined)
                            return
                        }

                        const nextValue = value ? new Date(value) : new Date()
                        nextValue.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
                        onChange(nextValue)
                    }}
                    initialFocus
                />

                <div className="mt-3 border-t pt-3">
                    <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="size-3" />
                        Giờ áp dụng
                    </label>
                    <Input
                        type="time"
                        value={selectedTime}
                        disabled={disabled}
                        onChange={(event) => {
                            const { hour, minute } = parseTime(event.target.value)
                            const nextValue = value ? new Date(value) : new Date()
                            nextValue.setHours(hour, minute, 0, 0)
                            onChange(nextValue)
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}

export { DateTimePicker }
