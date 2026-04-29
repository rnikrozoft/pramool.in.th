"use client"

import React, { useContext, useEffect, useState } from "react"
import { getMyProfile, updateMyProfile } from "@/app/lib/api/user"
import { UserContext } from "@/app/context/UserContext"
import Swal from "sweetalert2"
import subDistricts from "@/app/data/sub-districts.json"
import districts from "@/app/data/districts.json"
import provinces from "@/app/data/provinces.json"
import { recordOTPTimeout, requestOTP, verifyOTP } from "@/app/lib/api/otp"
import {
  ZipcodeInput,
  ProvinceSelect,
  DistrictSelect,
  SubDistrictSelect,
} from "@/app/components/LocationSelector"

type ProfileForm = {
  first_name: string
  last_name: string
  address_primary: string
  address: string
  soi: string
  road: string
  sub_district: string
  district: string
  province: string
  zip_code: string
  facebook: string
}

type ProfilePayload = ProfileForm & {
  tel: string
}

export default function ProfilePage() {
  const { user, refreshSession } = useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [userID, setUserID] = useState("")
  const [tel, setTel] = useState("")
  const [zipcode, setZipcode] = useState("")
  const [provinceId, setProvinceId] = useState<number | null>(null)
  const [districtId, setDistrictId] = useState<number | null>(null)
  const [subDistrictId, setSubDistrictId] = useState<number | null>(null)
  const [initialPayload, setInitialPayload] = useState<ProfilePayload | null>(null)
  const [form, setForm] = useState<ProfileForm>({
    first_name: "",
    last_name: "",
    address_primary: "",
    address: "",
    soi: "",
    road: "",
    sub_district: "",
    district: "",
    province: "",
    zip_code: "",
    facebook: "",
  })

  useEffect(() => {
    // Prefill quickly from session cache so fields are not empty while loading API.
    if (!user) return
    setForm((prev) => ({
      ...prev,
      first_name: user.firstName || prev.first_name,
      last_name: user.lastName || prev.last_name,
    }))
  }, [user])

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const profile = await getMyProfile()
        setUserID(profile.user_id || "")
        setTel(profile.tel || "")
        setForm((prev) => ({
          first_name: profile.first_name || prev.first_name,
          last_name: profile.last_name || prev.last_name,
          address_primary: profile.address_primary || "",
          address: profile.address || "",
          soi: profile.soi || "",
          road: profile.road || "",
          sub_district: profile.sub_district || "",
          district: profile.district || "",
          province: profile.province || "",
          zip_code: profile.zip_code || "",
          facebook: profile.facebook || "",
        }))
        setZipcode(profile.zip_code || "")

        const matchedProvince = provinces.find((item) => item.name_th === profile.province)
        const matchedDistrict = districts.find(
          (item) =>
            item.name_th === profile.district &&
            (!matchedProvince || item.province_id === matchedProvince.province_id),
        )
        const matchedSubDistrict = subDistricts.find(
          (item) =>
            item.name_th === profile.sub_district &&
            (!matchedDistrict || item.district_id === matchedDistrict.district_id),
        )

        setProvinceId(matchedProvince?.province_id ?? null)
        setDistrictId(matchedDistrict?.district_id ?? null)
        setSubDistrictId(matchedSubDistrict?.subdistrict_id ?? null)
        setInitialPayload({
          tel: (profile.tel || "").trim(),
          first_name: (profile.first_name || "").trim(),
          last_name: (profile.last_name || "").trim(),
          address_primary: (profile.address_primary || "").trim(),
          address: (profile.address || "").trim(),
          soi: (profile.soi || "").trim(),
          road: (profile.road || "").trim(),
          sub_district: (profile.sub_district || "").trim(),
          district: (profile.district || "").trim(),
          province: (profile.province || "").trim(),
          zip_code: (profile.zip_code || "").trim(),
          facebook: (profile.facebook || "").trim(),
        })
      } catch (error) {
        setErrorMessage("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้")
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}
    if (!tel.trim()) nextErrors.tel = "กรุณากรอกเบอร์โทรศัพท์"
    if (!form.first_name.trim()) nextErrors.first_name = "กรุณากรอกชื่อ"
    if (!form.last_name.trim()) nextErrors.last_name = "กรุณากรอกนามสกุล"
    if (!form.address_primary.trim()) nextErrors.address_primary = "กรุณากรอกที่อยู่ 1"
    if (!/^\d{5}$/.test(zipcode)) nextErrors.zip_code = "รหัสไปรษณีย์ต้องมี 5 หลัก"
    if (!provinceId) nextErrors.province = "กรุณาเลือกจังหวัด"
    if (!districtId) nextErrors.district = "กรุณาเลือกเขต/อำเภอ"
    if (!subDistrictId) nextErrors.sub_district = "กรุณาเลือกแขวง/ตำบล"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const verifyOtpByTel = async () => {
    const channel = "tel" as const
    const channelLabel = "เบอร์โทรศัพท์"

    let otpResponse
    try {
      otpResponse = await requestOTP({
        tel: tel.trim(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message.includes("temporarily banned")) {
        const bannedUntilPart = message.split("|")[1]
        const bannedUntil = Number(bannedUntilPart)
        if (!Number.isNaN(bannedUntil) && bannedUntil > 0) {
          const remainingSeconds = Math.ceil(bannedUntil - Date.now() / 1000)
          setErrorMessage(`${channelLabel}นี้ถูกระงับชั่วคราว กรุณาลองใหม่ใน ${Math.max(remainingSeconds, 1)} วินาที`)
          return false
        }
      }
      throw error
    }

    const verifyResult = await Swal.fire({
      title: "ยืนยัน OTP",
      text: `กรุณากรอก OTP ที่ส่งไปยัง${channelLabel}`,
      input: "text",
      inputPlaceholder: "กรอก OTP 4 หลัก",
      inputAttributes: {
        maxlength: "4",
        inputmode: "numeric",
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      width: 460,
      buttonsStyling: false,
      timer: 10000,
      customClass: {
        popup: "rounded-2xl",
        title: "text-2xl font-semibold text-slate-900",
        htmlContainer: "text-sm text-slate-500",
        actions: "gap-2",
        confirmButton: "btn-primary min-w-[110px]",
        cancelButton: "btn-outline min-w-[110px]",
        input: "form-input",
      },
      didOpen: () => {
        const otpInput = Swal.getInput()
        if (otpInput) {
          otpInput.style.width = "calc(100% - 24px)"
          otpInput.style.maxWidth = "calc(100% - 24px)"
          otpInput.style.margin = "8px auto 0"
          otpInput.style.boxSizing = "border-box"
        }
        const popup = Swal.getPopup()
        if (popup) {
          popup.style.position = "relative"
          popup.style.overflow = "hidden"
          const bar = document.createElement("div")
          bar.style.position = "absolute"
          bar.style.left = "12px"
          bar.style.right = "12px"
          bar.style.bottom = "8px"
          bar.style.height = "3px"
          bar.style.width = "auto"
          bar.style.background = "#2563eb"
          bar.style.borderRadius = "9999px"
          bar.style.transformOrigin = "left center"
          bar.style.transition = "transform 10s linear"
          popup.appendChild(bar)
          requestAnimationFrame(() => {
            bar.style.transform = "scaleX(0)"
          })
        }
      },
      inputValidator: (value) => {
        if (!value) return "กรุณากรอก OTP"
        if (!/^\d{4}$/.test(value)) return "OTP ต้องเป็นตัวเลข 4 หลัก"
        return undefined
      },
    })
    if (verifyResult.dismiss === Swal.DismissReason.timer || verifyResult.dismiss === Swal.DismissReason.cancel) {
      const timeoutResult = await recordOTPTimeout(tel.trim())
      if (timeoutResult.status === "banned") {
        setErrorMessage(`คุณใส่ OTP ไม่ทันครบ 2 ครั้ง ระบบระงับ${channelLabel}นี้ 5 นาที`)
        return false
      }
      if (verifyResult.dismiss === Swal.DismissReason.cancel) {
        setErrorMessage("คุณยกเลิกการยืนยัน OTP")
      } else {
        setErrorMessage("หมดเวลาใส่ OTP กรุณาลองใหม่อีกครั้ง")
      }
      return false
    }
    if (!verifyResult.isConfirmed) return false

    const verified = await verifyOTP({
      token: otpResponse.token,
      pin: verifyResult.value,
    })
    if (!verified) {
      setErrorMessage("OTP ไม่ถูกต้อง")
      return false
    }
    return true
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")
    try {
      const provinceName = provinces.find((item) => item.province_id === provinceId)?.name_th || ""
      const districtName = districts.find((item) => item.district_id === districtId)?.name_th || ""
      const subDistrictName = subDistricts.find((item) => item.subdistrict_id === subDistrictId)?.name_th || ""
      const nextPayload: ProfilePayload = {
        tel: tel.trim(),
        ...form,
        zip_code: zipcode.trim(),
        province: provinceName.trim(),
        district: districtName.trim(),
        sub_district: subDistrictName.trim(),
      }

      if (initialPayload) {
        const hasChanges = (Object.keys(nextPayload) as Array<keyof ProfilePayload>).some(
          (key) => String(nextPayload[key]).trim() !== String(initialPayload[key]).trim(),
        )
        if (!hasChanges) {
          setSuccessMessage("ไม่มีข้อมูลที่เปลี่ยนแปลง")
          return
        }
      }

      // Business rule: if profile data changed, verify with phone OTP every time.
      const otpOk = await verifyOtpByTel()
      if (!otpOk) return

      await updateMyProfile(nextPayload)
      await refreshSession()
      setInitialPayload({
        ...nextPayload,
        tel: nextPayload.tel.trim(),
        first_name: nextPayload.first_name.trim(),
        last_name: nextPayload.last_name.trim(),
        address_primary: nextPayload.address_primary.trim(),
        address: nextPayload.address.trim(),
        soi: nextPayload.soi.trim(),
        road: nextPayload.road.trim(),
        sub_district: nextPayload.sub_district.trim(),
        district: nextPayload.district.trim(),
        province: nextPayload.province.trim(),
        zip_code: nextPayload.zip_code.trim(),
        facebook: nextPayload.facebook.trim(),
      })
      setSuccessMessage("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว")
    } catch {
      setErrorMessage("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto mt-8 max-w-7xl px-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">โปรไฟล์ของฉัน</h1>
        <p className="mt-1 text-sm text-slate-500">อัปเดตข้อมูลส่วนตัวและที่อยู่สำหรับใช้งานระบบประมูล</p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">ข้อมูลส่วนตัวและที่อยู่</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">รหัสผู้ใช้</label>
                    <input className="form-input bg-slate-50" value={userID} disabled />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์โทรศัพท์</label>
                    <input
                      className="form-input"
                      value={tel}
                      onChange={(event) => {
                        setTel(event.target.value)
                        setErrors((prev) => ({ ...prev, tel: "" }))
                      }}
                    />
                    {errors.tel && <p className="mt-1 text-xs text-rose-600">{errors.tel}</p>}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อ</label>
                    <input name="first_name" className="form-input" value={form.first_name} onChange={handleChange} />
                    {errors.first_name && <p className="mt-1 text-xs text-rose-600">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">นามสกุล</label>
                    <input name="last_name" className="form-input" value={form.last_name} onChange={handleChange} />
                    {errors.last_name && <p className="mt-1 text-xs text-rose-600">{errors.last_name}</p>}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่ 1</label>
                  <input name="address_primary" className="form-input" value={form.address_primary} onChange={handleChange} />
                  {errors.address_primary && <p className="mt-1 text-xs text-rose-600">{errors.address_primary}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่ 2</label>
                  <input name="address" className="form-input" value={form.address} onChange={handleChange} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">ซอย</label>
                    <input name="soi" className="form-input" value={form.soi} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">ถนน</label>
                    <input name="road" className="form-input" value={form.road} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">หมายเลขไปรษณีย์</label>
                    <ZipcodeInput
                      value={zipcode}
                      onChange={(zip) => {
                        setZipcode(zip)
                        setErrors((prev) => ({ ...prev, zip_code: "" }))
                        setProvinceId(null)
                        setDistrictId(null)
                        setSubDistrictId(null)
                      }}
                    />
                    {errors.zip_code && <p className="mt-1 text-xs text-rose-600">{errors.zip_code}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">จังหวัด</label>
                    <ProvinceSelect
                      zipcode={zipcode}
                      value={provinceId}
                      onChange={(id) => {
                        setProvinceId(id || null)
                        setDistrictId(null)
                        setSubDistrictId(null)
                        setErrors((prev) => ({ ...prev, province: "" }))
                      }}
                      disabled={!zipcode}
                    />
                    {errors.province && <p className="mt-1 text-xs text-rose-600">{errors.province}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">เขต/อำเภอ</label>
                    <DistrictSelect
                      provinceId={provinceId}
                      value={districtId}
                      onChange={(id) => {
                        setDistrictId(id || null)
                        setSubDistrictId(null)
                        setErrors((prev) => ({ ...prev, district: "" }))
                      }}
                      disabled={!provinceId}
                    />
                    {errors.district && <p className="mt-1 text-xs text-rose-600">{errors.district}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">แขวง/ตำบล</label>
                    <SubDistrictSelect
                      districtId={districtId}
                      value={subDistrictId}
                      onChange={(id) => {
                        setSubDistrictId(id || null)
                        setErrors((prev) => ({ ...prev, sub_district: "" }))
                      }}
                      disabled={!districtId}
                    />
                    {errors.sub_district && <p className="mt-1 text-xs text-rose-600">{errors.sub_district}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">ข้อมูลติดต่อ</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Facebook</label>
                  <input name="facebook" className="form-input" value={form.facebook} onChange={handleChange} />
                </div>
              </div>
            </div>

            {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-emerald-700">{successMessage}</p>}

            <button type="submit" className="btn-primary w-full lg:w-auto" disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
