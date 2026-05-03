"use client"

import React, { useContext, useEffect, useState } from "react"
import { getBanks, getMyProfile, updateMyProfile } from "@/app/lib/api/user"
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
  BankSelect,
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
  bank_id: number | null
  bank_account_name: string
  bank_account_number: string
}

type ProfilePayload = Omit<ProfileForm, "bank_id"> & {
  tel: string
  bank_id: number
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
  const [banks, setBanks] = useState<Array<{ bank_id: number; name_th: string; name_en: string }>>([])
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
    bank_id: null,
    bank_account_name: "",
    bank_account_number: "",
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
    async function loadBanks() {
      try {
        const list = await getBanks()
        setBanks(list)
      } catch {
        setBanks([])
      }
    }
    void loadBanks()
  }, [])

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
          bank_id: Number(profile.bank_id || 0) || null,
          bank_account_name: profile.bank_account_name || "",
          bank_account_number: profile.bank_account_number || "",
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
          bank_id: Number(profile.bank_id || 0),
          bank_account_name: (profile.bank_account_name || "").trim(),
          bank_account_number: (profile.bank_account_number || "").trim(),
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
    if (!form.bank_id) nextErrors.bank_id = "กรุณาเลือกธนาคาร"
    if (!form.bank_account_name.trim()) nextErrors.bank_account_name = "กรุณากรอกชื่อบัญชีธนาคาร"
    if (!/^\d{10,16}$/.test(form.bank_account_number.trim())) {
      nextErrors.bank_account_number = "เลขบัญชีธนาคารต้องเป็นตัวเลข 10-16 หลัก"
    }
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
        bank_id: Number(form.bank_id || 0),
        bank_account_name: form.bank_account_name.trim(),
        bank_account_number: form.bank_account_number.trim(),
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
        bank_id: Number(nextPayload.bank_id || 0),
        bank_account_name: nextPayload.bank_account_name.trim(),
        bank_account_number: nextPayload.bank_account_number.trim(),
      })
      setSuccessMessage("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว")
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
        showClass: {
          popup: "swal2-toast-fade-in",
        },
        hideClass: {
          popup: "swal2-toast-fade-out",
        },
      })
    } catch {
      setErrorMessage("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Profile</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">โปรไฟล์ของฉัน</h1>
        <p className="mt-1 text-sm text-slate-600">อัปเดตข้อมูลส่วนตัวและที่อยู่สำหรับใช้งานระบบประมูล</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">1. ข้อมูลส่วนตัว</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">2. ที่อยู่สำหรับติดต่อ</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">3. ช่องทางติดต่อ</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">4. ข้อมูลบัญชีธนาคาร</span>
        </div>
      </section>

      {loading ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">1) ข้อมูลส่วนตัว</h3>
                <p className="mt-1 text-sm text-slate-500">ข้อมูลพื้นฐานของบัญชีผู้ใช้งาน</p>
                <div className="mt-5 space-y-4">
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
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">2) ที่อยู่สำหรับติดต่อ</h3>
                <p className="mt-1 text-sm text-slate-500">ใช้สำหรับการจัดส่งและการติดต่อหลังการซื้อขาย</p>
                <div className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่ 1</label>
                      <input name="address_primary" className="form-input" value={form.address_primary} onChange={handleChange} />
                      {errors.address_primary && <p className="mt-1 text-xs text-rose-600">{errors.address_primary}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่ 2</label>
                      <input name="address" className="form-input" value={form.address} onChange={handleChange} />
                    </div>
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
                          setForm((prev) => ({ ...prev, zip_code: zip }))
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
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">3) ช่องทางติดต่อ</h3>
                <p className="mt-1 text-sm text-slate-500">เพิ่มช่องทางสำหรับผู้ซื้อหรือผู้ขายติดต่อกลับ</p>
                <div className="mt-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Facebook</label>
                    <input name="facebook" className="form-input" value={form.facebook} onChange={handleChange} />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">4) ข้อมูลบัญชีธนาคาร</h3>
                <p className="mt-1 text-sm text-slate-500">ใช้สำหรับการรับเงินหลังการขายหรือปิดประมูล</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อธนาคาร</label>
                    <BankSelect
                      banks={banks}
                      value={form.bank_id}
                      onChange={(id) => {
                        setForm((prev) => ({ ...prev, bank_id: id }))
                        setErrors((prev) => ({ ...prev, bank_id: "" }))
                      }}
                    />
                    {errors.bank_id && <p className="mt-1 text-xs text-rose-600">{errors.bank_id}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อบัญชี</label>
                    <input name="bank_account_name" className="form-input" value={form.bank_account_name} onChange={handleChange} />
                    {errors.bank_account_name && <p className="mt-1 text-xs text-rose-600">{errors.bank_account_name}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">เลขบัญชีธนาคาร</label>
                    <input name="bank_account_number" inputMode="numeric" className="form-input" value={form.bank_account_number} onChange={handleChange} />
                    {errors.bank_account_number && <p className="mt-1 text-xs text-rose-600">{errors.bank_account_number}</p>}
                  </div>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">สรุปก่อนบันทึก</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400"></span><span>หากมีการแก้ไขข้อมูล จะต้องยืนยัน OTP ทุกครั้ง</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400"></span><span>ตรวจสอบเบอร์โทรศัพท์ให้ใช้งานได้จริง</span></li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400"></span><span>ที่อยู่ควรถูกต้องเพื่อใช้จัดส่งสินค้า</span></li>
                </ul>

                {errorMessage && <p className="mt-4 text-sm text-rose-600">{errorMessage}</p>}
                {successMessage && <p className="mt-4 text-sm text-emerald-700">{successMessage}</p>}

                <button type="submit" className="btn-primary mt-5 w-full py-3 text-base" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </aside>
          </div>
        </form>
      )}
    </main>
  )
}
