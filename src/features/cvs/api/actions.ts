"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import {
  ActionError,
  action,
  assertOk,
  parse,
  requireRole,
  unwrap,
} from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

import { CV_BUCKET, CV_SIGNED_URL_TTL_SECONDS } from "../lib/constants"
import {
  countActiveCvs,
  findMemberCv,
  insertMemberCv,
  renameMemberCv,
  softDeleteMemberCv,
} from "../data/cvs.repo"
import {
  createRegisterCvSchema,
  createRenameCvSchema,
  type RegisterCvInput,
  type RenameCvInput,
} from "../schemas"
import { mapMemberCv, type MemberCv } from "../types"

const validation = () => getTranslations("cvs.validation")

function revalidateCvs() {
  revalidatePath("/profile/edit")
  revalidatePath("/jobs", "layout")
}

// Sau khi client upload file PDF vào bucket `cv/<userId>/<uuid>.pdf` thành công,
// gọi action này để ghi metadata vào member_cvs. Action verify lại path khớp
// userId (chống user trick đăng ký path của người khác).
export async function registerCvAction(
  input: RegisterCvInput,
): Promise<ActionResult<MemberCv>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createRegisterCvSchema(await validation()), input)

    // Path layout: <userId>/<uuid>.pdf — segment[0] phải khớp current user
    // (chống user trick đăng ký path của người khác).
    const pathOwner = data.storagePath.split("/")[0]
    if (pathOwner !== String(current.appUser.id)) {
      throw ActionError.key("invalidStoragePath")
    }

    const supabase = await createClient()
    const activeCount = await countActiveCvs(supabase, current.appUser.id)
    const isDefault = data.makeDefault ?? activeCount === 0

    // Nếu đặt CV mới là default thì hạ default của CV cũ trước (tránh vi phạm
    // unique index uk_member_cvs_default_per_user).
    if (isDefault && activeCount > 0) {
      assertOk(
        await supabase
          .from("member_cvs")
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq("user_id", current.appUser.id)
          .eq("is_default", true),
        "unexpected",
      )
    }

    const row = unwrap(
      await insertMemberCv(supabase, {
        userId: current.appUser.id,
        fileName: data.fileName,
        storagePath: data.storagePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        isDefault,
      }),
      "unexpected",
    )

    revalidateCvs()
    return mapMemberCv(row)
  })
}

export async function renameCvAction(
  input: RenameCvInput,
): Promise<ActionResult> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createRenameCvSchema(await validation()), input)
    const supabase = await createClient()
    assertOk(
      await renameMemberCv(
        supabase,
        data.id,
        current.appUser.id,
        data.fileName,
      ),
      "unexpected",
    )
    revalidateCvs()
  })
}

// Xoá mềm + xoá file binary trong storage (admin client để bypass policy delete
// — vì policy chỉ cho phép owner xoá, mà server action đang chạy với user JWT
// nên owner check vẫn pass; dùng admin để đảm bảo dọn rác ngay cả nếu sau này
// có lỗ hổng policy).
export async function deleteCvAction(cvId: number): Promise<ActionResult> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    if (!Number.isInteger(cvId) || cvId <= 0) {
      throw ActionError.key("invalidId")
    }
    const supabase = await createClient()
    const { data: cv } = await findMemberCv(supabase, cvId, current.appUser.id)
    if (!cv) throw ActionError.key("notFound")

    assertOk(
      await softDeleteMemberCv(supabase, cvId, current.appUser.id),
      "unexpected",
    )

    // Best-effort xoá file. Lỗi storage không làm rollback DB (vẫn còn metadata
    // soft-deleted; có thể cleanup batch sau).
    const admin = createAdminClient()
    const { error: removeErr } = await admin.storage
      .from(CV_BUCKET)
      .remove([cv.storage_path])
    if (removeErr) {
      console.error("[deleteCvAction] storage remove failed", removeErr)
    }

    revalidateCvs()
  })
}

export async function setDefaultCvAction(cvId: number): Promise<ActionResult> {
  return action("cvs.errors", async () => {
    await requireRole("member")
    if (!Number.isInteger(cvId) || cvId <= 0) {
      throw ActionError.key("invalidId")
    }
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("set_default_member_cv", {
      p_cv_id: cvId,
    })
    if (error) {
      console.error("[setDefaultCvAction] rpc error", error)
      throw ActionError.key("unexpected")
    }
    const result = data as { ok: boolean; error?: string } | null
    if (!result?.ok) {
      throw ActionError.key(result?.error ?? "unexpected")
    }
    revalidateCvs()
  })
}

// Sinh signed URL ngắn hạn cho member tự xem CV của mình. Bucket `cvs` PRIVATE
// → KHÔNG có URL công khai; mọi lượt xem đều qua URL ký hết hạn 5 phút.
export async function getCvViewUrlAction(input: {
  cvId?: number
  storagePath?: string
}): Promise<ActionResult<{ url: string }>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    if (!input.cvId) throw ActionError.key("invalidId")
    const supabase = await createClient()
    const { data: cv } = await findMemberCv(
      supabase,
      input.cvId,
      current.appUser.id,
    )
    if (!cv) throw ActionError.key("notFound")

    const { data, error } = await supabase.storage
      .from(CV_BUCKET)
      .createSignedUrl(cv.storage_path, CV_SIGNED_URL_TTL_SECONDS)
    if (error || !data) {
      console.error("[getCvViewUrl]", error)
      throw ActionError.key("unexpected")
    }
    return { url: data.signedUrl }
  })
}

// Server-side action: trả về danh sách CV của member hiện tại — dùng cho UI
// client cần load CVs động (vd: Easy Apply dialog) mà không phải truyền qua
// SSR props từ trang job-detail.
export async function loadOwnCvsAction(): Promise<
  ActionResult<
    { id: number; fileName: string; fileSize: number; isDefault: boolean }[]
  >
> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const supabase = await createClient()
    const { data } = await supabase
      .from("member_cvs")
      .select("id, file_name, file_size, is_default")
      .eq("user_id", current.appUser.id)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    return ((data ?? []) as Array<{
      id: number
      file_name: string
      file_size: number
      is_default: boolean
    }>).map((row) => ({
      id: row.id,
      fileName: row.file_name,
      fileSize: row.file_size,
      isDefault: row.is_default,
    }))
  })
}

// Company xem CV ứng viên: signed URL hoặc link ngoài tuỳ vào dạng resume_url
// lưu trong job_applications. RPC get_company_applicants chỉ trả ứng viên đã
// apply vào job của company → có job_id để verify. Đường dẫn storage trong
// resume_url được nhận diện qua việc KHÔNG bắt đầu bằng http(s)://.
export async function getApplicantResumeUrlAction(input: {
  applicationId: number
}): Promise<ActionResult<{ url: string; kind: "external" | "signed" }>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("company")
    if (!Number.isInteger(input.applicationId) || input.applicationId <= 0) {
      throw ActionError.key("invalidId")
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("job_applications")
      .select("resume_url, jobs!inner(company_user_id)")
      .eq("id", input.applicationId)
      .maybeSingle<{
        resume_url: string | null
        jobs: { company_user_id: number } | null
      }>()
    if (error) {
      console.error("[getApplicantResumeUrl] db", error)
      throw ActionError.key("unexpected")
    }
    if (!data || data.jobs?.company_user_id !== current.appUser.id) {
      throw ActionError.key("forbidden")
    }
    const raw = data.resume_url?.trim() ?? ""
    if (!raw) throw ActionError.key("notFound")

    if (/^https?:\/\//i.test(raw)) {
      return { url: raw, kind: "external" as const }
    }

    // raw là storage_path (vd: <userId>/<uuid>.pdf) trong bucket private `cvs`.
    // Server (user JWT) gọi createSignedUrl — RLS policy "cvs: owner select"
    // chỉ cho owner; ở đây caller là company → cần dùng admin client để
    // bypass RLS (đã verify quyền nghiệp vụ ở trên qua jobs!inner).
    const { data: signed, error: signErr } = await supabase.storage
      .from(CV_BUCKET)
      .createSignedUrl(raw, CV_SIGNED_URL_TTL_SECONDS)
    if (signErr || !signed) {
      // Fallback: thử admin client (service_role) — kéo dài tương thích nếu
      // RLS policy thay đổi sau này. Hợp lệ vì ta đã verify company quyền.
      const admin = createAdminClient()
      const { data: aSigned, error: aErr } = await admin.storage
        .from(CV_BUCKET)
        .createSignedUrl(raw, CV_SIGNED_URL_TTL_SECONDS)
      if (aErr || !aSigned) {
        console.error("[getApplicantResumeUrl] sign", signErr, aErr)
        throw ActionError.key("unexpected")
      }
      return { url: aSigned.signedUrl, kind: "signed" as const }
    }
    return { url: signed.signedUrl, kind: "signed" as const }
  })
}
