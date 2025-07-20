import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: -1 },
  { label: 'This week', days: -7 },
  { label: 'Last 7 days', days: -7 },
  { label: 'Last 30 days', days: -30 },
  { label: 'This month', days: 'month' },
  { label: 'This year', days: 'year' },
] as const;

const DateRangePicker = ({
  setDateRange,
  fromColor,
  toColor,
}: {
  setDateRange: any;
  fromColor: string;
  toColor: string;
}) => {
  const [date, setDate] = React.useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);

  // Helper functions for date calculations
  const getPresetRange = (preset: (typeof PRESETS)[number]) => {
    const today = new Date();
    const from = new Date();

    switch (preset.days) {
      case 0:
        return { from: today, to: today };
      case -1:
        from.setDate(today.getDate() - 1);
        return { from, to: from };
      case -7:
        from.setDate(today.getDate() - 7);
        return { from, to: today };
      case -30:
        from.setDate(today.getDate() - 30);
        return { from, to: today };
      case 'month':
        from.setDate(1);
        return { from, to: today };
      case 'year':
        from.setMonth(0, 1);
        return { from, to: today };
      default:
        return { from: today, to: today };
    }
  };

  const handlePresetClick = (preset: (typeof PRESETS)[number]) => {
    setSelectedPreset(preset.label);
    setDate(getPresetRange(preset));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // Returns "2023-12-31" format
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[280px] justify-start text-left font-normal bg-background',
            'hover:bg-muted/50',
            !date && 'text-muted-foreground'
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {formatDate(date.from)} - {formatDate(date.to)}
              </>
            ) : (
              formatDate(date.from)
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex space-x-2">
          {/* Presets */}
          <div className="w-[140px] p-2 space-y-1 border-r">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left font-normal px-2 py-1.5 h-auto',
                  `hover:bg-gradient-to-r hover:from-${fromColor}-500/20 hover:to-${toColor}-500/20 hover:text-${fromColor}-600`,
                  `dark:hover:from-${fromColor}-400/20 dark:hover:to-${toColor}-400/20 dark:hover:text-${fromColor}-400`,
                  selectedPreset === preset.label &&
                    `bg-gradient-to-r from-${fromColor}-500/20 to-${toColor}-500/20 text-${fromColor}-600`,
                  selectedPreset === preset.label &&
                    `dark:from-${fromColor}-400/20 dark:to-${toColor}-400/20 dark:text-${fromColor}-400`
                )}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-2">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate as any);
                setSelectedPreset(null);
              }}
              numberOfMonths={1}
              className="border-0"
              classNames={{
                months: 'space-y-4',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium',
                nav: 'space-x-1 flex items-center',
                nav_button: cn('h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'),
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: cn(
                  'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
                  '[&:has([aria-selected].day-range-end)]:rounded-r-md',
                  '[&:has([aria-selected].day-range-start)]:rounded-l-md'
                ),
                day: cn('h-8 w-8 p-0 font-normal aria-selected:opacity-100'),
                day_range_start: 'day-range-start',
                day_range_end: 'day-range-end',
                day_selected: `bg-gradient-to-r from-${fromColor}-500 to-${toColor}-500 text-primary-foreground hover:bg-gradient-to-r hover:from-${fromColor}-500 hover:to-${toColor}-500 hover:text-primary-foreground focus:bg-gradient-to-r focus:from-${fromColor}-500 focus:to-${toColor}-500 focus:text-primary-foreground`,
                day_today: 'bg-accent text-accent-foreground',
                day_outside: 'text-muted-foreground opacity-50',
                day_disabled: 'text-muted-foreground opacity-50',
                day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                day_hidden: 'invisible',
              }}
            />
            <div className="border-t mt-4 pt-4 border-border/50">
              <Button
                className={`w-full bg-gradient-to-r from-${fromColor}-500 to-${toColor}-500 hover:from-${fromColor}-600 hover:to-${toColor}-600`}
                onClick={() => {
                  const dateRange = {
                    from: formatDate(date.from), // Will be like "2023-12-31"
                    to: formatDate(date.to), // Will be like "2024-01-31"
                  };
                  setDateRange(dateRange);
                }}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
