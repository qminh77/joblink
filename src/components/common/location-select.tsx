"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  // Tỉnh ứng với danh sách ward hiện có — tránh nạp lại thừa.
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

  function handleProvince(next: string) {
    const id = next === NONE ? null : Number(next)
    // Đổi tỉnh → ward cũ không còn hợp lệ, reset về null.
    onChange({ provinceId: id, wardId: null })
  }

  function handleWard(next: string) {
    onChange({ provinceId, wardId: next === NONE ? null : Number(next) })
  }

  // Danh sách ward để render: ưu tiên list đã nạp; nếu chưa nạp mà có wardId +
  // tên đã lưu thì dựng tạm một option để value hiển thị đúng.
  const wardOptions: WardOption[] =
    provinceId == null
      ? []
      : wards.length > 0
        ? wards
        : wardId != null && initialWardName
          ? [{ id: wardId, name: initialWardName }]
          : []

  const wardDisabled = disabled || provinceId == null || loadingWards

  return (
    <div className={className ?? "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
      <div className="space-y-2">
        <Label>{t("province")}</Label>
        <Select
          value={provinceId != null ? String(provinceId) : NONE}
          onValueChange={handleProvince}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 rounded-xl w-full">
            <SelectValue placeholder={t("selectProvince")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("none")}</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={String(province.id)}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("ward")}</Label>
        <Select
          value={wardId != null ? String(wardId) : NONE}
          onValueChange={handleWard}
          disabled={wardDisabled}
        >
          <SelectTrigger className="h-10 rounded-xl w-full">
            <SelectValue
              placeholder={loadingWards ? t("loading") : t("selectWard")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("none")}</SelectItem>
            {wardOptions.map((ward) => (
              <SelectItem key={ward.id} value={String(ward.id)}>
                {ward.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
