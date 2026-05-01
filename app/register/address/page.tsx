'use client'
import React, { useContext, useEffect, useState } from 'react'
import subDistricts from '../../data/sub-districts.json';
import districts from '../../data/districts.json';
import provinces from '../../data/provinces.json';
import {
    ZipcodeInput,
    ProvinceSelect,
    DistrictSelect,
    SubDistrictSelect
} from "@/app/components/LocationSelector"
import { getMyOnboardingStatus } from "@/app/lib/api/user"
import { callPostAPI } from '@/app/lib/utils/call-api';
import { callGetAPI } from '@/app/lib/utils/call-api';
import { useRouter } from 'next/navigation';
import { UserContext } from '@/app/context/UserContext';


export default function AddressPage() {
    const router = useRouter();
    const { refreshSession } = useContext(UserContext)
    const [zipcode, setZipcode] = useState("")
    const [provinceId, setProvinceId] = useState<number | null>(null)
    const [districtId, setDistrictId] = useState<number | null>(null)
    const [subDistrictId, setSubDistrictId] = useState<number | null>(null)
    const [verifiedTel, setVerifiedTel] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [kycErrors, setKycErrors] = useState<Record<string, string>>({})
    const [contactForm, setContactForm] = useState({
        facebook: "",
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
                zip_code: zipcode,
                province: provinceName,
                district: districtName,
                sub_district: subDistrictName,
            }

            const register = await callPostAPI('/users', completeFormData, true)
            if (!register.ok) {
                throw new Error(`HTTP error! Status: ${register.status}`);
            }

            await refreshSession()
            localStorage.removeItem("phone");
            router.push('/');
            return;

        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    };

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

    return (
        <form className="mx-auto mt-8 max-w-7xl space-y-6 px-4" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-xl font-semibold text-slate-900">ข้อมูลที่อยู่สำหรับสมัครสมาชิก</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">หมายเลขบัตรประชาชน <span className="text-red-500">*</span></label>
                            <input type="text" className="form-input" name='user_id' value={formData.user_id} onChange={handleChange} inputMode="numeric" maxLength={13} />
                            {errors.user_id && <p className="mt-1 text-xs text-red-500">{errors.user_id}</p>}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="firstName" className="mb-1 block text-sm font-medium">ชื่อ <span className="text-red-500">*</span></label>
                                <input type="text" className="form-input" name='first_name' value={formData.first_name} onChange={handleChange} />
                                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="mb-1 block text-sm font-medium">นามสกุล <span className="text-red-500">*</span></label>
                                <input type="text" className="form-input" name='last_name' value={formData.last_name} onChange={handleChange} />
                                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="address2" className="mb-1 block text-sm font-medium">ที่อยู่ 1 <span className="text-red-500">*</span></label>
                            <input type="text" className="form-input" placeholder='บ้านเลขที่ หมู่ที่ หมู่บ้าน' name='address_primary' value={formData.address_primary} onChange={handleChange} />
                            {errors.address_primary && <p className="mt-1 text-xs text-red-500">{errors.address_primary}</p>}
                        </div>
                        <div>
                            <label htmlFor="address2" className="mb-1 block text-sm font-medium">ที่อยู่ 2</label>
                            <input type="text" className="form-input" placeholder='อาคาร ชั้น เลขที่ห้อง' name='address' value={formData.address} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="address" className="mb-1 block text-sm font-medium">ซอย</label>
                            <input type="text" className="form-input" name='soi' value={formData.soi} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="address" className="mb-1 block text-sm font-medium">ถนน</label>
                            <input type="text" className="form-input" name='road' value={formData.road} onChange={handleChange} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="zip" className="mb-1 block text-sm font-medium">หมายเลขไปรษณีย์ <span className="text-red-500">*</span></label>
                                <ZipcodeInput
                                    value={zipcode}
                                    onChange={(zip) => {
                                        setZipcode(zip)
                                        setErrors((prev) => ({ ...prev, zipcode: "" }))
                                        setProvinceId(null)
                                        setDistrictId(null)
                                        setSubDistrictId(null)
                                    }}
                                />
                                {errors.zipcode && <p className="mt-1 text-xs text-red-500">{errors.zipcode}</p>}
                            </div>
                            <div>
                                <label htmlFor="address" className="mb-1 block text-sm font-medium">จังหวัด <span className="text-red-500">*</span></label>
                                <ProvinceSelect
                                    zipcode={zipcode}
                                    value={provinceId}
                                    onChange={(id) => {
                                        setProvinceId(id)
                                        setErrors((prev) => ({ ...prev, provinceId: "" }))
                                        setDistrictId(null)
                                        setSubDistrictId(null)
                                    }}
                                    disabled={!zipcode}
                                />
                                {errors.provinceId && <p className="mt-1 text-xs text-red-500">{errors.provinceId}</p>}
                            </div>
                            <div>
                                <label htmlFor="address" className="mb-1 block text-sm font-medium">เขต/อำเภอ <span className="text-red-500">*</span></label>
                                <DistrictSelect
                                    provinceId={provinceId}
                                    value={districtId}
                                    onChange={(id) => {
                                        setDistrictId(id)
                                        setErrors((prev) => ({ ...prev, districtId: "" }))
                                        setSubDistrictId(null)
                                    }}
                                    disabled={!provinceId}
                                />
                                {errors.districtId && <p className="mt-1 text-xs text-red-500">{errors.districtId}</p>}
                            </div>
                            <div>
                                <label htmlFor="address" className="mb-1 block text-sm font-medium">แขวง/ตำบล <span className="text-red-500">*</span></label>
                                <SubDistrictSelect
                                    districtId={districtId}
                                    value={subDistrictId}
                                    onChange={(id) => {
                                        setSubDistrictId(id)
                                        setErrors((prev) => ({ ...prev, subDistrictId: "" }))
                                    }}
                                    disabled={!districtId}
                                />
                                {errors.subDistrictId && <p className="mt-1 text-xs text-red-500">{errors.subDistrictId}</p>}
                            </div>
                        </div>
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-2 text-xl font-semibold text-slate-900">ข้อมูลติดต่อ</h3>
                        <p className="mb-4 text-sm text-slate-500">กรอกเบอร์โทรและบัญชี Facebook สำหรับการติดต่อและยืนยันตัวตน</p>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="form-input bg-slate-100 text-slate-600"
                                value={verifiedTel}
                                placeholder="08xxxxxxxx"
                                inputMode="numeric"
                                disabled
                            />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Facebook</label>
                                <input type="text" className="form-input" name="facebook" value={contactForm.facebook} onChange={handleContactChange} placeholder="facebook.com/username" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-2 text-xl font-semibold text-slate-900">อัปโหลดเอกสารยืนยันตัวตน (KYC)</h3>
                        <p className="mb-4 text-sm text-slate-500">เพื่อเพิ่มความน่าเชื่อถือและความปลอดภัยในการประมูล กรุณาอัปโหลดเอกสารให้ครบ</p>
                        <div className="space-y-4">
                            <div>
                            <label className="mb-1 block text-sm font-medium">บัตรประชาชนด้านหน้า</label>
                                <input type="file" className="form-input file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm" accept="image/*,.pdf" onChange={(e) => handleKycFileChange(e, "idCardFront")} />
                                {kycErrors.idCardFront && <p className="mt-1 text-xs text-red-500">{kycErrors.idCardFront}</p>}
                            </div>
                            <div>
                            <label className="mb-1 block text-sm font-medium">บัตรประชาชนด้านหลัง</label>
                                <input type="file" className="form-input file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm" accept="image/*,.pdf" onChange={(e) => handleKycFileChange(e, "idCardBack")} />
                                {kycErrors.idCardBack && <p className="mt-1 text-xs text-red-500">{kycErrors.idCardBack}</p>}
                            </div>
                            <div>
                            <label className="mb-1 block text-sm font-medium">รูปถ่ายถือบัตรคู่หน้า</label>
                                <input type="file" className="form-input file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-sm" accept="image/*" onChange={(e) => handleKycFileChange(e, "selfieWithCard")} />
                                {kycErrors.selfieWithCard && <p className="mt-1 text-xs text-red-500">{kycErrors.selfieWithCard}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button id="next-btn" className="btn-primary w-full py-3 text-base" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลทั้งหมด"}
            </button>
        </form>
    )
}