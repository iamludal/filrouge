import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/app/theme'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
]

export function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme()
  const Icon = resolved === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Changer de thème">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => setPreference(value as ThemePreference)}
        >
          {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <OptionIcon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
