import { Menu } from "@base-ui/react/menu"
import { PROJECT_CHIP_LIMIT, type Project } from "../lib/projects"
import { MenuPopup, MenuSeparator } from "../ui/menu"

type Props = {
  projects: Project[]
  selectedPaths: string[] | null
  disabled: boolean
  onToggle: (path: string) => void
  onReset: () => void
}

const buttonStyle =
  "rounded-full border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
const inactiveStyle =
  "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
const activeStyle = "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200"
const itemStyle =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-zinc-800 outline-none select-none data-highlighted:bg-zinc-100 data-disabled:opacity-50 dark:text-zinc-100 dark:data-highlighted:bg-zinc-700"

export function ProjectFilter({ projects, selectedPaths, disabled, onToggle, onReset }: Props) {
  const all = selectedPaths === null
  const total = projects.reduce((sum, project) => sum + project.count, 0)
  return (
    <div role="group" aria-label="Filter by project" className="flex shrink-0 flex-wrap items-center gap-2 px-4 pt-4">
      <button
        type="button"
        aria-pressed={all}
        disabled={disabled}
        onClick={onReset}
        className={`${buttonStyle} ${all ? activeStyle : inactiveStyle}`}
      >
        All projects <span className="ml-1 opacity-60">{total}</span>
      </button>
      {projects.length <= PROJECT_CHIP_LIMIT ? (
        projects.map((project) => (
          <button
            key={project.path}
            type="button"
            title={project.path || "Unknown project"}
            aria-pressed={selectedPaths?.includes(project.path) ?? false}
            disabled={disabled}
            onClick={() => onToggle(project.path)}
            className={`${buttonStyle} ${selectedPaths?.includes(project.path) ? activeStyle : inactiveStyle} max-w-72`}
          >
            <span className="flex items-center gap-2">
              <span className="truncate">{project.label}</span>
              <span className="opacity-60">{project.count}</span>
            </span>
          </button>
        ))
      ) : (
        <Menu.Root>
          <Menu.Trigger disabled={disabled} className={`${buttonStyle} ${all ? inactiveStyle : activeStyle}`}>
            Projects · {all ? "All" : `${selectedPaths.length} selected`} <span aria-hidden="true">▾</span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={6} align="start" className="z-50">
              <MenuPopup className="max-h-[min(24rem,var(--available-height))] max-w-[min(28rem,var(--available-width))] overflow-y-auto">
                <Menu.CheckboxItem
                  checked={all}
                  onCheckedChange={onReset}
                  disabled={disabled}
                  closeOnClick={false}
                  className={itemStyle}
                >
                  <span className="w-4 shrink-0">
                    <Menu.CheckboxItemIndicator>✓</Menu.CheckboxItemIndicator>
                  </span>
                  <span className="flex-1">All projects</span>
                  <span className="text-xs text-zinc-400">{total}</span>
                </Menu.CheckboxItem>
                <MenuSeparator />
                {projects.map((project) => (
                  <Menu.CheckboxItem
                    key={project.path}
                    label={project.label}
                    title={project.path || "Unknown project"}
                    checked={selectedPaths?.includes(project.path) ?? false}
                    onCheckedChange={() => onToggle(project.path)}
                    disabled={disabled}
                    closeOnClick={false}
                    className={itemStyle}
                  >
                    <span className="w-4 shrink-0">
                      <Menu.CheckboxItemIndicator>✓</Menu.CheckboxItemIndicator>
                    </span>
                    <span className="min-w-0 flex-1 truncate">{project.label}</span>
                    <span className="text-xs text-zinc-400">{project.count}</span>
                  </Menu.CheckboxItem>
                ))}
              </MenuPopup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  )
}
