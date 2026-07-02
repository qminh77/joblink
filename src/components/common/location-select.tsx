"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"

import { Label } from "@/components/ui/label"
import { SearchSelect, type SearchOption } from "@/components/ui/search-select"
import {
  fetchWardsAction,
  type WardOption,
} from "@/features/profile/api/location-actions"
import type { ProvinceRow } from "@/types/database"

export type LocationValue = {
  provinceId: number | null
  wardId: number | null
}

type Props = {
  provinces: Pick<ProvinceRow, "id" | "name">[]
  value: LocationValue
  onChange: (next: LocationValue) => void
  /** Tên Xã/Phường đã lưu — hiển thị nhãn trước khi danh sách ward được nạp. */
  initialWardName?: string | null
  disabled?: boolean
  className?: string
}

const NONE = "none"

// Selector Tỉnh → Xã/Phường dùng chung cho profile member, profile company và
// form đăng/sửa job. Chọn Tỉnh sẽ tự nạp danh sách Xã/Phường (cascading) qua
// fetchWardsAction và reset wardId nếu đổi tỉnh.
export function LocationSelect({
  provinces,
  value,
  onChange,
  initialWardName,
  disabled,
  className,
}: Props) {
  const t = useTranslations("common.location")
  const [wards, setWards] = useState<WardOption[]>([])
  const [loadingWards, setLoadingWards] = useState(false)
  const loadedProvinceRef = useRef<number | null>(null)

  const { provinceId, wardId } = value

  useEffect(() => {
    if (provinceId == null) {
      loadedProvinceRef.current = null
      return
    }
    if (loadedProvinceRef.current === provinceId) return
    let cancelled = false
    fetchWardsAction(provinceId)
      .then((result) => {
        if (cancelled) return
        setWards(result)
        loadedProvinceRef.current = provinceId
        setLoadingWards(false)
      })
      .catch(() => {
        if (!cancelled) setLoadingWards(false)
      })
    setLoadingWards(true)
    return () => {
      cancelled = true
    }
  }, [provinceId])

  const handleProvince = useCallback(
    (next: string) => {
      const id = next === NONE ? null : Number(next)
      onChange({ provinceId: id, wardId: null })
    },
    [onChange],
  )

  const handleWard = useCallback(
    (next: string) => {
      onChange({ provinceId, wardId: next === NONE ? null : Number(next) })
    },
    [onChange, provinceId],
  )

  const provinceOptions = useMemo<SearchOption[]>(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    [provinces],
  )

  const wardOptions = useMemo<SearchOption[]>(() => {
    const wardRaw: WardOption[] =
      provinceId == null
        ? []
        : wards.length > 0
          ? wards
          : wardId != null && initialWardName
            ? [{ id: wardId, name: initialWardName }]
            : []

    return wardRaw.map((w) => ({ value: String(w.id), label: w.name }))
  }, [provinceId, wards, wardId, initialWardName])

  const wardDisabled = disabled || provinceId == null || loadingWards

  return (
    <div className={className ?? "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
      <div className="space-y-2">
        <Label>{t("province")}</Label>
        <SearchSelect
          options={provinceOptions}
          value={provinceId != null ? String(provinceId) : NONE}
          onValueChange={handleProvince}
          placeholder={t("selectProvince")}
          searchPlaceholder={t("searchProvince")}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("ward")}</Label>
        <SearchSelect
          options={wardOptions}
          value={wardId != null ? String(wardId) : NONE}
          onValueChange={handleWard}
          placeholder={
            loadingWards ? t("loading") : t("selectWard")
          }
          searchPlaceholder={t("searchWard")}
          disabled={wardDisabled}
        />
      </div>
    </div>
  )
}
