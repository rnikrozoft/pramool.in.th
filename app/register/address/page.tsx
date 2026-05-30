'use client'
import Link from "next/link"
import React, { useContext, useEffect, useState } from 'react'
import subDistricts from '../../data/sub-districts.json';
import districts from '../../data/districts.json';
import provinces from '../../data/provinces.json';
import AddressLocationFields from "@/app/components/AddressLocationFields"
import { BankSelect } from "@/app/components/LocationSelector"
import type { AddressLocationValue } from "@/app/lib/locationCascade"
import { getMyOnboardingStatus } from "@/app/lib/api/user"
import { callPostAPI } from '@/app/lib/utils/call-api';
import { callGetAPI } from '@/app/lib/utils/call-api';
import { useRouter } from 'next/navigation';
import { UserContext } from '@/app/context/UserContext';
import { AppPageShell, APP_PAGE_INNER } from "@/app/components/AppPageShell"
import { FormStepSection } from "@/app/components/FormStepSection"
import { notify } from "@/app/lib/utils/notify"
import { userFacingMessage } from "@/app/lib/utils/userFacingMessage"
import Icon from "@/app/components/Icon"

export default function AddressPage() {
    const router = useRouter();
    const { user, refreshSession } = useContext(UserContext)
    const [zipcode, setZipcode] = useState("")
    const [provinceId, setProvinceId] = useState<number | null>(null)
    const [districtId, setDistrictId] = useState<number | null>(null)
    const [subDistrictId, setSubDistrictId] = useState<number | null>(null)
    const [verifiedTel, setVerifiedTel] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [kycErrors, setKycErrors] = useState<Record<string, string>>({})
    const [banks, setBanks] = useState<Array<{ bank_id: number; name_th: string; name_en: string }>>([])
    const [contactForm, setContactForm] = useState({
        facebook: "",
        bank_id: null as number | null,
        bank_account_name: "",
        bank_account_number: "",
    })
    const [kycFiles, setKycFiles] = useState<{
        idCardFront: File | null
        idCardBack: File | null
        selfieWithCard: File | null
    }>({
        idCardFront: null,
        idCardBack: null,
        selfieWithCard: null,
    })

    const [formData, setFormData] = useState({
        user_id: "",
        tel: "",
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
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: "" }))
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setContactForm((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    const isValidThaiNationalId = (id: string) => {
        return true;
        if (!/^\d{13}$/.test(id)) return false
        let sum = 0
        for (let i = 0; i < 12; i += 1) {
            sum += Number(id[i]) * (13 - i)
        }
        const checkDigit = (11 - (sum % 11)) % 10
        return checkDigit === Number(id[12])
    }

    const validateAddressForm = () => {
        const nextErrors: Record<string, string> = {}

        if (!formData.user_id.trim()) {
            nextErrors.user_id = "กรุณากรอกเลขบัตรประชาชน"
        } else if (!isValidThaiNationalId(formData.user_id.trim())) {
            nextErrors.user_id = "เลขบัตรประชาชนไม่ถูกต้อง"
        }

        if (!formData.first_name.trim()) nextErrors.first_name = "กรุณากรอกชื่อ"
        if (!formData.last_name.trim()) nextErrors.last_name = "กรุณากรอกนามสกุล"
        if (!formData.address_primary.trim()) nextErrors.address_primary = "กรุณากรอกที่อยู่ 1"
        if (!/^\d{5}$/.test(zipcode)) nextErrors.zipcode = "รหัสไปรษณีย์ต้องมี 5 หลัก"
        if (!provinceId) nextErrors.provinceId = "กรุณาเลือกจังหวัด"
        if (!districtId) nextErrors.districtId = "กรุณาเลือกเขต/อำเภอ"
        if (!subDistrictId) nextErrors.subDistrictId = "กรุณาเลือกแขวง/ตำบล"

        if (!verifiedTel) nextErrors.phone = "ไม่พบเบอร์ที่ยืนยัน OTP กรุณายืนยันใหม่"
        if (!contactForm.bank_id) nextErrors.bank_id = "กรุณาเลือกธนาคาร"
        if (!contactForm.bank_account_name.trim()) nextErrors.bank_account_name = "กรุณากรอกชื่อบัญชีธนาคาร"
        if (!contactForm.bank_account_number.trim()) {
            nextErrors.bank_account_number = "กรุณากรอกเลขบัญชีธนาคาร"
        } else if (!/^\d{10,16}$/.test(contactForm.bank_account_number.trim())) {
            nextErrors.bank_account_number = "เลขบัญชีธนาคารต้องเป็นตัวเลข 10-16 หลัก"
        }

        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleKycFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        field: "idCardFront" | "idCardBack" | "selfieWithCard"
    ) => {
        const file = event.target.files?.[0] ?? null
        setKycFiles((prev) => ({ ...prev, [field]: file }))
        setKycErrors((prev) => ({ ...prev, [field]: "" }))
    }

    const validateKycForm = () => {
        setKycErrors({})
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isAddressValid = validateAddressForm()
        const isKycValid = validateKycForm()
        if (!isAddressValid || !isKycValid) return
        setIsSubmitting(true)

        try {
            const provinceName = provinces.find((p) => p.province_id === provinceId)?.name_th || ""
            const districtName = districts.find((d) => d.district_id === districtId)?.name_th || ""
            const subDistrictName = subDistricts.find((s) => s.subdistrict_id === subDistrictId)?.name_th || ""

            const completeFormData = {
                ...formData,
                tel: verifiedTel,
                facebook: contactForm.facebook.trim(),
                bank_id: contactForm.bank_id,
                bank_account_name: contactForm.bank_account_name.trim(),
                bank_account_number: contactForm.bank_account_number.trim(),
                zip_code: zipcode,
                province: provinceName,
                district: districtName,
                sub_district: subDistrictName,
            }

            const register = await callPostAPI("/users", completeFormData, true)
            if (!register.ok) {
                let raw = ""
                try {
                    const data = (await register.json()) as { message?: string }
                    if (data?.message) raw = data.message
                } catch {
                    /* ignore */
                }
                notify(
                    "error",
                    userFacingMessage(
                        raw,
                        register.status === 409
                            ? "ข้อมูลนี้อาจซ้ำกับในระบบ (เลขบัตร เบอร์โทร หรืออีเมล) กรุณาตรวจสอบ"
                            : "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่",
                    ),
                )
                return
            }

            await refreshSession({ force: true })
            localStorage.removeItem("phone")

            const onboardingStatus = await getMyOnboardingStatus()
            if (onboardingStatus.is_first_registration) {
                notify("error", "บันทึกข้อมูลยังไม่ครบ กรุณาตรวจสอบและลองใหม่")
                return
            }

            router.push("/")
            return

        } catch (error) {
            console.error(error)
            notify("error", "บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่")
        } finally {
            setIsSubmitting(false)
        }
    };

    useEffect(() => {
        async function loadBanks() {
            try {
                const response = await callGetAPI('/banks')
                if (!response.ok) return
                const data = await response.json()
                if (!Array.isArray(data)) return
                setBanks(data)
            } catch {
                setBanks([])
            }
        }

        loadBanks()
    }, [])

    /** Same source as Navbar: session user firstName / lastName */
    useEffect(() => {
        if (!user) return
        setFormData((prev) => {
            const keepFirst = prev.first_name.trim() !== ""
            const keepLast = prev.last_name.trim() !== ""
            if (keepFirst && keepLast) return prev
            return {
                ...prev,
                first_name: keepFirst ? prev.first_name : (user.firstName || ""),
                last_name: keepLast ? prev.last_name : (user.lastName || ""),
            }
        })
    }, [user])

    useEffect(() => {
        async function bootstrapAddressOnboarding() {
            try {
                const onboardingStatus = await getMyOnboardingStatus()
                if (!onboardingStatus.is_first_registration) {
                    router.replace("/")
                    return
                }

                const telFromLocal = localStorage.getItem("phone") ?? ""
                if (telFromLocal) {
                    setVerifiedTel(telFromLocal)
                    return
                }

                const response = await callGetAPI('/users', true)
                if (!response.ok) return
                const data = await response.json()
                if (data?.tel) setVerifiedTel(data.tel)
            } catch {
                setVerifiedTel("")
            }
        }

        bootstrapAddressOnboarding()
    }, [router])

    const displayName =
        `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim() || "ยังไม่ระบุชื่อ"

    return (
        <AppPageShell>
        <main className={APP_PAGE_INNER}>
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6">
            <div>
                <Link
                    href="/"
                    className="mb-2 inline-flex items-center gap-2 text-sm text-muted transition hover:text-slate-800 dark:hover:text-slate-200"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon name="fa-house" aria-hidden />
                    </span>
                    กลับหน้าหลัก
                </Link>
                <h1 className="text-heading text-2xl font-bold tracking-tight sm:text-3xl">ข้อมูลสมัครสมาชิก</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-body">
                    กรอกข้อมูลตามขั้นตอนด้านล่างเพื่อเปิดใช้งานบัญชีสำหรับซื้อขายและประมูล
                </p>
            </div>
        </div>

        <form
            id="onboarding-address-form"
            className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-stretch"
            noValidate
            onSubmit={handleSubmit}
        >
                <div className="space-y-8 lg:col-span-7">
                    <FormStepSection step={1} title="ข้อมูลส่วนตัว" description="ข้อมูลพื้นฐานสำหรับยืนยันตัวตนผู้สมัคร">
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-label">หมายเลขบัตรประชาชน <span className="text-red-500">*</span></label>
                                    <input type="text" className="form-input" name='user_id' value={formData.user_id} onChange={handleChange} inputMode="numeric" maxLength={13} />
                                    {errors.user_id && <p className="mt-1 text-xs text-red-500">{errors.user_id}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-label">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="form-input bg-slate-100 text-body dark:bg-slate-800/80"
                                        value={verifiedTel}
                                        placeholder="08xxxxxxxx"
                                        inputMode="numeric"
                                        disabled
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-label">ชื่อ <span className="text-red-500">*</span></label>
                                    <input type="text" className="form-input" name='first_name' value={formData.first_name} onChange={handleChange} />
                                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-label">นามสกุล <span className="text-red-500">*</span></label>
                                    <input type="text" className="form-input" name='last_name' value={formData.last_name} onChange={handleChange} />
                                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                                </div>
                            </div>
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                        </div>
                    </FormStepSection>

                    <FormStepSection step={2} title="ที่อยู่สำหรับสมัครสมาชิก" description="ใช้สำหรับที่อยู่จัดส่งและข้อมูลที่อยู่ในระบบ">
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="address2" className="mb-1 block text-sm font-medium text-label">ที่อยู่ 1 <span className="text-red-500">*</span></label>
                                    <input type="text" className="form-input" placeholder='บ้านเลขที่ หมู่ที่ หมู่บ้าน' name='address_primary' value={formData.address_primary} onChange={handleChange} />
                                    {errors.address_primary && <p className="mt-1 text-xs text-red-500">{errors.address_primary}</p>}
                                </div>
                                <div>
                                    <label htmlFor="address2" className="mb-1 block text-sm font-medium text-label">ที่อยู่ 2</label>
                                    <input type="text" className="form-input" placeholder='อาคาร ชั้น เลขที่ห้อง' name='address' value={formData.address} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="address" className="mb-1 block text-sm font-medium text-label">ซอย</label>
                                    <input type="text" className="form-input" name='soi' value={formData.soi} onChange={handleChange} />
                                </div>
                                <div>
                                    <label htmlFor="address" className="mb-1 block text-sm font-medium text-label">ถนน</label>
                                    <input type="text" className="form-input" name='road' value={formData.road} onChange={handleChange} />
                                </div>
                            </div>
                            <AddressLocationFields
                                value={{ subDistrictId, districtId, provinceId, zipcode }}
                                onChange={(next: AddressLocationValue) => {
                                    setSubDistrictId(next.subDistrictId)
                                    setDistrictId(next.districtId)
                                    setProvinceId(next.provinceId)
                                    setZipcode(next.zipcode)
                                    setFormData((prev) => ({ ...prev, zip_code: next.zipcode }))
                                    setErrors((prev) => ({
                                        ...prev,
                                        subDistrictId: "",
                                        districtId: "",
                                        provinceId: "",
                                        zipcode: "",
                                    }))
                                }}
                                errors={{
                                    subDistrictId: errors.subDistrictId,
                                    districtId: errors.districtId,
                                    provinceId: errors.provinceId,
                                    zipcode: errors.zipcode,
                                }}
                            />
                        </div>
                    </FormStepSection>

                    <FormStepSection step={3} title="ข้อมูลติดต่อ" description="ใช้สำหรับช่องทางติดต่อหลักของบัญชีผู้ใช้งาน">
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-label">Facebook</label>
                                <input type="text" className="form-input" name="facebook" value={contactForm.facebook} onChange={handleContactChange} placeholder="facebook.com/username" />
                            </div>
                        </div>
                    </FormStepSection>

                    <FormStepSection step={4} title="ข้อมูลบัญชีธนาคาร" description="ใช้สำหรับการรับเงินหลังการขายหรือปิดประมูล">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-label">ชื่อธนาคาร <span className="text-red-500">*</span></label>
                                <BankSelect
                                    banks={banks}
                                    value={contactForm.bank_id}
                                    onChange={(id) => {
                                        setContactForm((prev) => ({ ...prev, bank_id: id }))
                                        setErrors((prev) => ({ ...prev, bank_id: "" }))
                                    }}
                                />
                                {errors.bank_id && <p className="mt-1 text-xs text-red-500">{errors.bank_id}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-label">ชื่อบัญชี <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="bank_account_name"
                                    value={contactForm.bank_account_name}
                                    onChange={handleContactChange}
                                    placeholder="ชื่อ-นามสกุลเจ้าของบัญชี"
                                />
                                {errors.bank_account_name && <p className="mt-1 text-xs text-red-500">{errors.bank_account_name}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-label">เลขบัญชีธนาคาร <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="bank_account_number"
                                    value={contactForm.bank_account_number}
                                    onChange={handleContactChange}
                                    inputMode="numeric"
                                    placeholder="ตัวเลข 10-16 หลัก"
                                />
                                {errors.bank_account_number && <p className="mt-1 text-xs text-red-500">{errors.bank_account_number}</p>}
                            </div>
                        </div>
                    </FormStepSection>

                    <FormStepSection step={5} title="เอกสารยืนยันตัวตน (KYC)" description="เพิ่มความน่าเชื่อถือและความปลอดภัย กรุณาอัปโหลดเอกสารให้ครบ">
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-label">บัตรประชาชนด้านหน้า</label>
                                <input type="file" className="form-input file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm" accept="image/*,.pdf" onChange={(e) => handleKycFileChange(e, "idCardFront")} />
                                {kycErrors.idCardFront && <p className="mt-1 text-xs text-red-500">{kycErrors.idCardFront}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-label">บัตรประชาชนด้านหลัง</label>
                                <input type="file" className="form-input file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm" accept="image/*,.pdf" onChange={(e) => handleKycFileChange(e, "idCardBack")} />
                                {kycErrors.idCardBack && <p className="mt-1 text-xs text-red-500">{kycErrors.idCardBack}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-label">รูปถ่ายถือบัตรคู่หน้า</label>
                                <input type="file" className="form-input file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm" accept="image/*" onChange={(e) => handleKycFileChange(e, "selfieWithCard")} />
                                {kycErrors.selfieWithCard && <p className="mt-1 text-xs text-red-500">{kycErrors.selfieWithCard}</p>}
                            </div>
                        </div>
                    </FormStepSection>
                </div>

            <aside className="mt-10 flex flex-col lg:col-span-5 lg:mt-0">
                <div className="lg:sticky lg:top-20 lg:z-10 lg:h-fit lg:w-full">
                    <div className="sidebar-panel sm:p-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">สรุปก่อนบันทึก</h3>
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/80">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted">ชื่อที่แสดง</p>
                            <p className="mt-1 text-sm font-semibold text-heading">{displayName}</p>
                            {verifiedTel.trim() ? (
                                <p className="mt-2 text-xs text-body">
                                    <span className="text-muted">โทร </span>
                                    {verifiedTel.trim()}
                                </p>
                            ) : null}
                        </div>

                        <ul className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-body dark:border-slate-700">
                            <li className="flex gap-2">
                                <span className="mt-0.5 shrink-0 text-emerald-600">
                                    <Icon name="fa-circle-check" aria-hidden />
                                </span>
                                ตรวจสอบชื่อ-นามสกุล และเลขบัตรให้ถูกต้อง
                            </li>
                            <li className="flex gap-2">
                                <span className="mt-0.5 shrink-0 text-emerald-600">
                                    <Icon name="fa-circle-check" aria-hidden />
                                </span>
                                เลือกธนาคารและกรอกเลขบัญชี 10-16 หลัก
                            </li>
                            <li className="flex gap-2">
                                <span className="mt-0.5 shrink-0 text-emerald-600">
                                    <Icon name="fa-circle-check" aria-hidden />
                                </span>
                                อัปโหลดเอกสาร KYC ให้ครบทั้ง 3 รายการ
                            </li>
                        </ul>

                        <button
                            id="next-btn"
                            type="submit"
                            form="onboarding-address-form"
                            className="btn-primary mt-5 w-full py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลทั้งหมด"}
                        </button>
                        <p className="mt-3 text-xs text-muted">ช่องที่มี <span className="text-red-500">*</span> จำเป็นต้องกรอก</p>
                    </div>
                </div>
            </aside>
        </form>
        </main>
        </AppPageShell>
    )
}
