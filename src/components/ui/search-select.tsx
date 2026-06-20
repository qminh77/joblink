"use client"

import { forwardRef, useCallback, useMemo, useState, type ElementRef } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export type SearchOption = {
  value: string
  label: string
}

type SearchSelectProps = {
  options: SearchOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  /** Mỗi lần chọn xong có tự đóng dropdown không */
  closeOnSelect?: boolean
}

export const SearchSelect = forwardRef<ElementRef<typeof PopoverTrigger>, SearchSelectProps>(
  function SearchSelect(
    {
      options,
      value,
      onValueChange,
      placeholder = "Select...",
      searchPlaceholder = "Search...",
      emptyMessage = "No results.",
      disabled,
      className,
      closeOnSelect = true,
    },
    ref,
  ) {
    const [open, setOpen] = useState(false)
    const selectedLabel = useMemo(
      () => options.find((o) => o.value === value)?.label,
      [options, value],
    )

    const handleSelect = useCallback(
      (currentValue: string) => {
        const next = currentValue === value ? value : currentValue
        onValueChange(next)
        if (closeOnSelect) setOpen(false)
      },
      [value, onValueChange, closeOnSelect],
    )

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-between rounded-xl font-normal",
              !selectedLabel && "text-muted-foreground",
              className,
            )}
          >
            <span className="truncate">{selectedLabel ?? placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)
