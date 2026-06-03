"use client"

import Image from "next/image"
import Link from "next/link"
import React, { useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserContext } from "../context/UserContext"
import { login } from "../lib/api/user"
import { runPostAuthRedirect } from "../lib/postAuthRedirect"
import { notify, queueNotify } from "../lib/utils/notify"
import { userFacingMessage } from "../lib/utils/userFacingMessage"
import Icon from "@/app/components/Icon"

const features = [
  {
    icon: "fa-shield-halved",
    title: "ปลอดภัย 100%",
    desc: "มาตรฐานความปลอดภัยระดับสากล ข้อมูลและธุรกรรมได้รับการปกป้อง",
  },
  {
    icon: "fa-gavel",
    title: "ประมูลง่าย",
    desc: "ใช้งานสะดวก ลุ้นของที่ต้องการได้ทุกที่ทุกเวลา",
  },
  {
    icon: "fa-users",
    title: "ชุมชนผู้ใช้งานจริง",
    desc: "ไว้วางใจจากผู้ใช้งานกว่า 50,000 คน",
  },
]

const REMEMBER_LOGIN_KEY = "pramool_remember_login"

export default function LoginPage() {
  const router = useRouter()
  const { refreshSession } = useContext(UserContext)
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try {
      setRememberMe(localStorage.getItem(REMEMBER_LOGIN_KEY) === "1")
    } catch {
      /* ignore */
    }
  }, [])

  const handleSocial = (provider: string) => {
    notify("info", `การเข้าสู่ระบบด้วย ${provider} จะเปิดให้ใช้งานเร็วๆ นี้`)
  }

  const persistPhoneForOnboarding = (raw: string) => {
    const digits = raw.replace(/\D/g, "")
    if (digits.length >= 9) {
      const ten = digits.length >= 10 ? digits.slice(-10) : `0${digits.slice(-9)}`
      localStorage.setItem("phone", ten)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = loginId.trim()
    const pw = password.trim()
    if (!id) {
      notify("error", "กรุณากรอกเบอร์โทรศัพท์หรืออีเมล")
      return
    }
    if (!pw) {
      notify("error", "กรุณากรอกรหัสผ่าน")
      return
    }
    if (pw.length < 8) {
      notify("error", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      return
    }
    setSubmitting(true)
    try {
      const { ok, message } = await login(id, pw, rememberMe)
      if (!ok) {
        notify(
          "error",
          userFacingMessage(
            message ?? "",
            "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบเบอร์หรืออีเมลและรหัสผ่าน",
          ),
        )
        return
      }
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_LOGIN_KEY, "1")
        } else {
          localStorage.removeItem(REMEMBER_LOGIN_KEY)
        }
      } catch {
        /* ignore */
      }
      persistPhoneForOnboarding(id)
      await refreshSession({ force: true })
      queueNotify("success", "เข้าสู่ระบบสำเร็จ")
      await runPostAuthRedirect(router)
    } catch {
      notify("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page-shell">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 xl:px-14 2xl:px-16">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            <h1 className="font-display text-3xl font-bold leading-tight text-brand-700 dark:text-brand-400 md:text-4xl lg:text-[2.75rem]">
              ประมูลง่าย ได้ของชัวร์
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-body md:text-base">
              แพลตฟอร์มประมูลออนไลน์ที่เชื่อถือได้ ปลอดภัย โปร่งใส ได้ของจริง 100%
            </p>
            <ul className="mt-10 space-y-6">
              {features.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-2 ring-brand-100/80 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900/50">
                    <Icon name={f.icon} aria-hidden />
                  </span>
                  <div>
                    <p className="font-display font-bold text-heading">{f.title}</p>
                    <p className="mt-0.5 text-sm text-body">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="relative mt-10 flex justify-center lg:justify-start">
              <Image
                src="/9db16efa-b384-4eda-ada1-55a5946e5e8e.png"
                alt="Pramool — ประมูลออนไลน์"
                width={560}
                height={420}
                className="h-auto w-full max-w-md drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="auth-card">
              <div className="text-center sm:text-left">
                <h2 className="font-display text-xl font-bold text-heading sm:text-2xl">เข้าสู่ระบบ</h2>
                <p className="mt-1 text-sm text-body">ยินดีต้อนรับกลับมา</p>
              </div>

              <form className="mt-8 space-y-4" noValidate onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="login-id" className="mb-1.5 block text-sm font-medium text-label">
                    เบอร์โทรศัพท์หรืออีเมล <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    >
                      <Icon name="fa-user" />
                    </span>
                    <input
                      id="login-id"
                      type="text"
                      autoComplete="username"
                      className="form-input pl-10"
                      placeholder="กรอกเบอร์โทรศัพท์หรืออีเมล"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-label">
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    >
                      <Icon name="fa-lock" />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      minLength={8}
                      className="form-input pl-10 pr-11"
                      placeholder="กรอกรหัสผ่าน"
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

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    จดจำการเข้าสู่ระบบ
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs font-medium text-muted">
                  <span className="auth-divider-label">หรือเข้าสู่ระบบด้วย</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocial("Facebook")}
                  className="auth-social-btn"
                >
                  <i className="fa-brands fa-facebook shrink-0 text-lg text-[#1877F2]" aria-hidden />
                  Facebook
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-body">
                ยังไม่มีบัญชี?{" "}
                <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300">
                  สมัครสมาชิก
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
