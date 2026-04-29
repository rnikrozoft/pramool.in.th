'use client'

import Image from 'next/image'
import React, { useState, useContext } from 'react'
import { getMyOnboardingStatus, loginByTel } from '../lib/api/user'
import Swal from 'sweetalert2'
import { notify } from '../lib/utils/notify'
import { useRouter } from 'next/navigation'
import { recordOTPTimeout, requestOTP, verifyOTP } from '../lib/api/otp'
import { VerifyRequest } from '../types/otp_type'
import { UserContext } from '../context/UserContext'


type Props = {}

export default function Page({ }: Props) {
    const router = useRouter()
    const { refreshSession } = useContext(UserContext)
    const [tel, setTel] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTel(e.target.value)
    }

    const promptOTP = async (tel: string, token: string) => {
        const result = await Swal.fire({
            title: 'ยืนยัน OTP',
            text: `กรุณากรอก OTP ที่ส่งไปยังเบอร์โทรศัพท์ ${tel}`,
            input: 'text',
            inputPlaceholder: 'กรอก OTP 4 หลัก',
            inputAttributes: {
                maxlength: '4',
                inputmode: 'numeric',
                autocapitalize: 'off',
                autocorrect: 'off',
            },
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            width: 460,
            buttonsStyling: false,
            customClass: {
                popup: "rounded-2xl",
                title: "text-2xl font-semibold text-slate-900",
                htmlContainer: "text-sm text-slate-500",
                actions: "gap-2",
                confirmButton: "btn-primary min-w-[110px]",
                cancelButton: "btn-outline min-w-[110px]",
                input: "form-input",
            },
            timer: 10000,
            inputValidator: value => {
                if (!value) return 'กรุณากรอก OTP'
                if (!/^\d{4}$/.test(value)) return 'OTP ต้องเป็นตัวเลข 4 หลัก'
                return null
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
        })

        return result
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!tel) {
            notify('error', 'กรุณากรอกหมายเลขโทรศัพท์')
            return
        }

        try {
            const otpRes = await requestOTP({ tel })
            const result = await promptOTP(tel, otpRes.token)
            if (result.dismiss === Swal.DismissReason.timer || result.dismiss === Swal.DismissReason.cancel) {
                const timeoutResult = await recordOTPTimeout(tel)
                if (timeoutResult.status === "banned") {
                    notify('error', 'คุณยืนยัน OTP ไม่สำเร็จครบ 2 ครั้ง ระบบระงับเบอร์นี้ 5 นาที')
                    return
                }
                if (result.dismiss === Swal.DismissReason.cancel) {
                    notify('error', 'คุณยกเลิกการยืนยัน OTP')
                } else {
                    notify('error', 'หมดเวลาใส่ OTP กรุณาลองใหม่อีกครั้ง')
                }
                return
            }
            if (result.isConfirmed) {
                const verifyReq: VerifyRequest = {
                    token: otpRes.token,
                    pin: result.value!,
                }
                const isValidOTP = await verifyOTP(verifyReq)

                if (isValidOTP) {
                    const loginSuccess = await loginByTel(tel)
                    if (!loginSuccess) {
                        notify('error', 'ไม่สามารถเข้าสู่ระบบอัตโนมัติได้')
                        return
                    }

                    await refreshSession()
                    notify('success', 'ยืนยันสำเร็จ').then(() => {
                        getMyOnboardingStatus()
                            .then((status) => {
                                if (!status.is_first_registration) {
                                    router.push('/')
                                    return
                                }
                                localStorage.setItem("phone", tel)
                                router.push('/register/address')
                            })
                            .catch(() => {
                                // If onboarding status endpoint fails, keep onboarding-friendly behavior.
                                localStorage.setItem("phone", tel)
                                router.push('/register/address')
                            })
                    });
                } else {
                    notify('error', 'รหัส OTP ไม่ถูกต้อง', 1)
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : ""
            if (message.includes("tel is temporarily banned")) {
                const bannedUntilPart = message.split("|")[1]
                const bannedUntil = Number(bannedUntilPart)
                if (!Number.isNaN(bannedUntil) && bannedUntil > 0) {
                    const remainingSeconds = Math.ceil(bannedUntil - Date.now() / 1000)
                    notify('error', `เบอร์นี้ถูกระงับชั่วคราว กรุณาลองใหม่ใน ${Math.max(remainingSeconds, 1)} วินาที`)
                    return
                }
            }
            notify('error')
        }
    }

    return (
        <div className="mx-auto mt-8 grid max-w-7xl items-center gap-6 px-4 lg:grid-cols-2">
            <div className="hidden items-center justify-center lg:flex">
                <Image width={500} height={500} src="./undraw_sign-up_qamz.svg" alt="Sign up illustration" />
            </div>
            <div className="h-fit w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-center text-2xl font-semibold">สมัครสมาชิก</h4>
                <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-1 block text-sm font-medium">หมายเลขโทรศัพท์</label>
                        <input
                            type="tel"
                            className="form-input"
                            required
                            name="tel"
                            value={tel}
                            onChange={handleChange}
                            pattern="\d*"
                            inputMode="numeric"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            โปรดระบุหมายเลขโทรศัพท์ เพื่อรับรหัส OTP (One-Time Password) สำหรับการยืนยันตัวตน
                        </p>
                    </div>
                    <button className="btn-primary w-full py-3 text-base" type="submit">
                        ส่ง OTP
                    </button>
                </form>
                </div>
        </div>
    )
}
