"use client"

import Link from "next/link"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import Icon from "@/app/components/Icon"
import { checkForgotPasswordEligibility, resetForgotPassword } from "@/app/lib/api/forgotPassword"
import { recordOTPTimeout, requestOTP } from "@/app/lib/api/otp"
import { openConfirmOtpSwal } from "@/app/lib/utils/confirmOtpSwal"
import { notify, queueNotify } from "@/app/lib/utils/notify"
import { userFacingMessage } from "@/app/lib/utils/userFacingMessage"

function normalizeTelInput(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length >= 10) return digits.slice(-10)
  if (digits.length >= 9) return `0${digits.slice(-9)}`
  return digits
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [tel, setTel] = useState("")
  const [otpToken, setOtpToken] = useState("")
  const [otpPin, setOtpPin] = useState("")
  const [otpVerified, setOtpVerified] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSendOtp = async () => {
    const normalized = normalizeTelInput(tel.trim())
    if (normalized.length < 9) {
      notify("error", "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
      return
    }

    setSendingOtp(true)
    try {
      const eligibility = await checkForgotPasswordEligibility(normalized)
      if (eligibility.status === "not_found") {
        notify("error", "ไม่พบบัญชีที่ใช้เบอร์นี้")
        return
      }

      const resolvedTel = eligibility.tel?.trim() || normalized
      setTel(resolvedTel)

      let otpResponse
      try {
        otpResponse = await requestOTP({ tel: resolvedTel })
      } catch (error) {
        const message = error instanceof Error ? error.message : ""
        if (message.includes("temporarily banned")) {
          const bannedUntilPart = message.split("|")[1]
          const bannedUntil = Number(bannedUntilPart)
          if (!Number.isNaN(bannedUntil) && bannedUntil > 0) {
            const remainingSeconds = Math.ceil(bannedUntil - Date.now() / 1000)
            notify("error", `เบอร์นี้ถูกระงับชั่วคราว กรุณาลองใหม่ใน ${Math.max(remainingSeconds, 1)} วินาที`)
            return
          }
        }
        throw error
      }

      const verifyResult = await openConfirmOtpSwal("เบอร์โทรศัพท์")
      if (verifyResult.dismiss === Swal.DismissReason.timer || verifyResult.dismiss === Swal.DismissReason.cancel) {
        const timeoutResult = await recordOTPTimeout(resolvedTel)
        if (timeoutResult.status === "banned") {
          notify("error", "คุณใส่รหัสยืนยันไม่ทันครบ 2 ครั้ง ระบบระงับเบอร์นี้ 5 นาที")
          return
        }
        if (verifyResult.dismiss === Swal.DismissReason.cancel) {
          notify("info", "ยกเลิกการยืนยันรหัส")
        } else {
          notify("error", "หมดเวลาใส่รหัสยืนยัน กรุณาลองใหม่")
        }
        return
      }
      if (!verifyResult.isConfirmed || !verifyResult.value) return

      setOtpToken(otpResponse.token)
      setOtpPin(verifyResult.value)
      setOtpVerified(true)
      queueNotify("success", "ยืนยันเบอร์โทรแล้ว กรุณาตั้งรหัสผ่านใหม่")
    } catch (error) {
      notify("error", userFacingMessage(error instanceof Error ? error.message : "", "ส่งรหัสยืนยันไม่สำเร็จ"))
    } finally {
      setSendingOtp(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpVerified || !otpToken || !otpPin) {
      notify("error", "กรุณายืนยันเบอร์โทรด้วยรหัส OTP ก่อน")
      return
    }
    if (password.length < 8) {
      notify("error", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      return
    }
    if (password !== confirmPassword) {
      notify("error", "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน")
      return
    }

    setSubmitting(true)
    try {
      const { ok, message } = await resetForgotPassword({
        tel: tel.trim(),
        token: otpToken,
        pin: otpPin,
        password,
        confirm_password: confirmPassword,
      })
      if (!ok) {
        notify("error", userFacingMessage(message ?? "", "ตั้งรหัสผ่านใหม่ไม่สำเร็จ"))
        return
      }
      queueNotify("success", "ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบ")
      router.push("/login")
    } catch {
      notify("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page-shell">
      <div className="mx-auto flex max-w-lg justify-center px-5 py-8 sm:px-8">
        <div className="auth-card w-full">
          <div className="text-center sm:text-left">
            <h1 className="font-display text-xl font-bold text-heading sm:text-2xl">ลืมรหัสผ่าน</h1>
            <p className="mt-1 text-sm text-body">
              ยืนยันเบอร์โทรด้วย OTP แล้วตั้งรหัสผ่านใหม่
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="forgot-tel" className="mb-1.5 block text-sm font-medium text-label">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                  <Icon name="fa-mobile-screen" />
                </span>
                <input
                  id="forgot-tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="form-input pl-10"
                  placeholder="กรอกเบอร์โทรศัพท์"
                  value={tel}
                  disabled={otpVerified}
                  onChange={(e) => setTel(e.target.value)}
                />
              </div>
            </div>

            {!otpVerified ? (
              <button
                type="button"
                disabled={sendingOtp}
                onClick={() => void handleSendOtp()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
              >
                {sendingOtp ? "กำลังส่งรหัสยืนยัน…" : "ส่งรหัสยืนยัน"}
              </button>
            ) : null}

            {otpVerified ? (
              <form className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700" onSubmit={handleReset}>
                <p className="text-sm font-medium text-brand-700 dark:text-brand-400">ยืนยันเบอร์แล้ว — ตั้งรหัสผ่านใหม่</p>
                <div>
                  <label htmlFor="forgot-password" className="mb-1.5 block text-sm font-medium text-label">
                    รหัสผ่านใหม่ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                      <Icon name="fa-lock" />
                    </span>
                    <input
                      id="forgot-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="form-input pl-10 pr-11"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <Icon name={showPassword ? "fa-eye-slash" : "fa-eye"} aria-hidden />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="forgot-confirm-password" className="mb-1.5 block text-sm font-medium text-label">
                    ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                      <Icon name="fa-lock" />
                    </span>
                    <input
                      id="forgot-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="form-input pl-10 pr-11"
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      <Icon name={showConfirmPassword ? "fa-eye-slash" : "fa-eye"} aria-hidden />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "กำลังบันทึก…" : "ตั้งรหัสผ่านใหม่"}
                </button>
              </form>
            ) : null}
          </div>

          <p className="mt-8 text-center text-sm text-body">
            จำรหัสผ่านได้แล้ว?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400">
              กลับไปเข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
