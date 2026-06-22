"use client"

import { useState, useTransition, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Key,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  getAdminRoleDetail,
  type AdminRoleRow,
} from "@/features/admin/api/roles"
import {
  MODULES,
  MODULE_LABELS,
  type ModuleName,
} from "@/lib/rbac/modules"
import { ACTION_LABELS, type ActionName } from "@/lib/rbac/actions"

type Editing = {
  __new?: boolean
  id: number
  name: string
  description: string
  selectedPermissions: Set<string>
}

type Props = {
  items: AdminRoleRow[]
  allPermissions: Array<{
    name: string
    module_name: ModuleName
    action_name: ActionName
  }>
}

export function RolesPanel({ items, allPermissions }: Props) {
  const t = useTranslations("admin.roles")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Editing | null>(null)
  const [actingId, setActingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, typeof allPermissions> = {}
    for (const perm of allPermissions) {
      if (!grouped[perm.module_name]) {
        grouped[perm.module_name] = []
      }
      grouped[perm.module_name].push(perm)
    }
    return grouped
  }, [allPermissions])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q),
    )
  }, [items, search])

  const openCreate = () => {
    setEditing({
      __new: true,
      id: 0,
      name: "",
      description: "",
      selectedPermissions: new Set(),
    })
    setExpandedModules(new Set(MODULES.slice(0, 3)))
  }

  const loadAndEdit = async (item: AdminRoleRow) => {
    setActingId(item.id)
    try {
      const detail = await getAdminRoleDetail(item.id)
      const perms = detail?.permissions ?? []
      const selectedModules = new Set<string>()
      for (const p of perms) {
        const mod = p.split(".")[0]
        selectedModules.add(mod)
      }
      setExpandedModules(selectedModules)
      setEditing({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        selectedPermissions: new Set(perms),
      })
    } catch {
      setEditing({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        selectedPermissions: new Set(),
      })
    } finally {
      setActingId(null)
    }
  }

  const toggleModule = (module: ModuleName) => {
    if (!editing) return
    const modulePerms = permissionsByModule[module] ?? []
    const allSelected = modulePerms.every((p) =>
      editing.selectedPermissions.has(p.name),
    )
    const next = new Set(editing.selectedPermissions)
    for (const perm of modulePerms) {
      if (allSelected) {
        next.delete(perm.name)
      } else {
        next.add(perm.name)
      }
    }
    setEditing({ ...editing, selectedPermissions: next })
  }

  const togglePermission = (permName: string) => {
    if (!editing) return
    const next = new Set(editing.selectedPermissions)
    if (next.has(permName)) {
      next.delete(permName)
    } else {
      next.add(permName)
    }
    setEditing({ ...editing, selectedPermissions: next })
  }

  const toggleModuleExpand = (module: string) => {
    const next = new Set(expandedModules)
    if (next.has(module)) {
      next.delete(module)
    } else {
      next.add(module)
    }
    setExpandedModules(next)
  }

  const submit = async () => {
    if (!editing) return
    if (!editing.name.trim()) {
      toast.error(tCommon("required"))
      return
    }
    if (editing.selectedPermissions.size === 0) {
      toast.error(t("minOnePermission"))
      return
    }
    startTransition(async () => {
      const payload = {
        name: editing.name.trim(),
        description: editing.description?.trim() || null,
        permissions: Array.from(editing.selectedPermissions),
      }
      const result = editing.__new
        ? await createAdminRole(payload)
        : await updateAdminRole({ ...payload, id: editing.id })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(editing.__new ? t("createSuccess") : t("updateSuccess"))
      setEditing(null)
      router.refresh()
    })
  }

  const remove = (item: AdminRoleRow) => {
    if (!confirm(t("confirmDelete"))) return
    setActingId(item.id)
    startTransition(async () => {
      const result = await deleteAdminRole(item.id)
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success(t("deleteSuccess"))
        router.refresh()
      }
      setActingId(null)
    })
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <form
          className="relative flex-1 max-w-md"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder") || "Tìm vai trò..."}
            className="pl-9 h-10 rounded-lg bg-transparent border-none shadow-none text-sm"
          />
        </form>
        <p className="text-sm text-muted-foreground self-center">
          {t("roleCount", { count: filteredItems.length })}
        </p>
        <Button
          onClick={openCreate}
          disabled={!!editing}
          className="rounded-lg gap-1.5 sm:ml-auto"
        >
          <Plus className="w-4 h-4" />
          {t("add")}
        </Button>
      </div>

      <Card className="bg-transparent border-none shadow-none rounded-xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left px-4 py-3 font-semibold">{t("name")}</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">{t("description")}</th>
                <th className="text-center px-4 py-3 font-semibold">{t("permissions")}</th>
                <th className="text-center px-4 py-3 font-semibold">{t("users")}</th>
                <th className="text-right px-4 py-3 font-semibold">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-12">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-60" />
                    <p>{search ? t("searchEmpty") : t("empty")}</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.is_system ? (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                            <ShieldCheck className="w-3 h-3 mr-0.5 inline" />
                            System
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:hidden mt-0.5">
                        {item.description ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate hidden sm:table-cell">
                      {item.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="text-xs">
                        <Key className="w-3 h-3 mr-1 inline" />
                        {item.permission_count}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1 inline" />
                        {item.user_count}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg"
                          disabled={actingId === item.id || item.name === "admin"}
                          onClick={() => loadAndEdit(item)}
                        >
                          {actingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Pencil className="w-4 h-4" />
                          )}
                        </Button>
                        {!item.is_system ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-500/10"
                            disabled={actingId === item.id}
                            onClick={() => remove(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-lg">
              {editing?.__new ? t("add") : t("edit")}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="px-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {t("name")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="content_moderator"
                    disabled={!!editing.id}
                    className="rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t("permissionHint")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {t("description")}
                  </label>
                  <Input
                    value={editing.description}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    placeholder={t("descriptionPlaceholder")}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-medium block">
                      {t("permissionLabel")} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("selectedCount", { selected: editing.selectedPermissions.size, total: allPermissions.length })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={() => {
                        const all = new Set(allPermissions.map((p) => p.name))
                        setEditing({ ...editing, selectedPermissions: all })
                        setExpandedModules(new Set(MODULES))
                      }}
                    >
                      {t("selectAll")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={() =>
                        setEditing({ ...editing, selectedPermissions: new Set() })
                      }
                    >
                      {t("deselectAll")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {MODULES.map((module) => {
                    const perms = permissionsByModule[module] ?? []
                    if (perms.length === 0) return null
                    const moduleSelected = perms.filter((p) =>
                      editing.selectedPermissions.has(p.name),
                    ).length
                    const allSelected = moduleSelected === perms.length
                    const someSelected =
                      moduleSelected > 0 && moduleSelected < perms.length
                    const isExpanded = expandedModules.has(module)

                    return (
                      <div
                        key={module}
                        className="border border-border/30 rounded-lg overflow-hidden"
                      >
                        <div
                          className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/20 cursor-pointer select-none"
                          onClick={() => toggleModuleExpand(module)}
                        >
                          <button
                            type="button"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleModuleExpand(module)
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          <label
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={allSelected}
                              ref={(el) => {
                                if (el && typeof el === "object" && "indeterminate" in el) {
                                  ;(el as HTMLInputElement).indeterminate = someSelected
                                }
                              }}
                              onCheckedChange={() => toggleModule(module)}
                            />
                            <span className="font-medium text-sm truncate">
                              {MODULE_LABELS[module]}
                            </span>
                          </label>
                          <Badge
                            variant={allSelected ? "default" : "outline"}
                            className="text-[10px] shrink-0"
                          >
                            {moduleSelected}/{perms.length}
                          </Badge>
                        </div>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-border/20 bg-muted/5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                              {perms.map((perm) => {
                                const isChecked = editing.selectedPermissions.has(perm.name)
                                return (
                                  <label
                                    key={perm.name}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      togglePermission(perm.name)
                                    }}
                                    className={`flex items-center gap-2 text-xs cursor-pointer py-1 px-2 rounded-md transition-colors ${
                                      isChecked
                                        ? "text-foreground bg-primary/5"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                    }`}
                                  >
                                    <div className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                                      isChecked
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-border"
                                    }`}>
                                      {isChecked && <Check className="w-3 h-3" />}
                                    </div>
                                    {ACTION_LABELS[perm.action_name]}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="px-6 py-4 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={pending}
              className="rounded-lg"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={submit}
              disabled={pending}
              className="rounded-lg gap-1.5"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
