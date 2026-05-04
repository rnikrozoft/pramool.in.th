"use client"

import Image from "next/image"
import Link from "next/link"
import React, { useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { UserContext } from "../context/UserContext"
import { login } from "../lib/api/user"
import { runPostAuthRedirect } from "../lib/postAuthRedirect"
import { notify } from "../lib/utils/notify"
import { userFacingMessage } from "../lib/utils/userFacingMessage"

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

export default function LoginPage() {
  const router = useRouter()
  const { refreshSession } = useContext(UserContext)
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    if (!id) {
      notify("error", "กรุณากรอกเบอร์โทรศัพท์หรืออีเมล")
      return
    }
    setSubmitting(true)
    try {
      const { ok, message } = await login(id, password)
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
      if (rememberMe) {
        try {
          localStorage.setItem("pramool_remember_login", "1")
        } catch {
          /* ignore */
        }
      }
      persistPhoneForOnboarding(id)
      await refreshSession()
      notify("success", "เข้าสู่ระบบสำเร็จ").then(() => {
        void runPostAuthRedirect(router)
      })
    } catch {
      notify("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-violet-50/80 via-white to-violet-50/40 pb-16 pt-8 sm:pt-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 xl:px-14 2xl:px-16">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            <h1 className="font-display text-3xl font-bold leading-tight text-brand-700 md:text-4xl lg:text-[2.75rem]">
              ประมูลง่าย ได้ของชัวร์
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 md:text-base">
              แพลตฟอร์มประมูลออนไลน์ที่เชื่อถือได้ ปลอดภัย โปร่งใส ได้ของจริง 100%
            </p>
            <ul className="mt-10 space-y-6">
              {features.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-2 ring-brand-100/80">
                    <i className={`fa-solid ${f.icon}`} aria-hidden />
                  </span>
                  <div>
                    <p className="font-display font-bold text-slate-900">{f.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{f.desc}</p>
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
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
              <div className="text-center sm:text-left">
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">เข้าสู่ระบบ</h2>
                <p className="mt-1 text-sm text-slate-600">ยินดีต้อนรับกลับมา</p>
              </div>

              <form className="mt-8 space-y-4" noValidate onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="login-id" className="mb-1.5 block text-sm font-medium text-slate-700">
                    เบอร์โทรศัพท์หรืออีเมล <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    >
                      <i className="fa-solid fa-user" />
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
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <span
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    >
                      <i className="fa-solid fa-lock" />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
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
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    บัญชีที่ยังไม่ได้ตั้งรหัสผ่านสามารถเว้นว่างได้ (เข้าด้วยเบอร์อย่างเดียว)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    จดจำการเข้าสู่ระบบ
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    onClick={() => notify("info", "ฟีเจอร์ลืมรหัสผ่านจะเปิดให้ใช้งานเร็วๆ นี้")}
                  >
                    ลืมรหัสผ่าน?
                  </button>
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
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs font-medium text-slate-500">
                  <span className="bg-white px-3">หรือเข้าสู่ระบบด้วย</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocial("Google")}
                  className="flex flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <i className="fa-brands fa-google shrink-0 text-lg text-red-500" aria-hidden />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocial("Facebook")}
                  className="flex flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <i className="fa-brands fa-facebook shrink-0 text-lg text-[#1877F2]" aria-hidden />
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => handleSocial("Apple")}
                  className="flex flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <i className="fa-brands fa-apple shrink-0 text-xl text-slate-900" aria-hidden />
                  Apple
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-slate-600">
                ยังไม่มีบัญชี?{" "}
                <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
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
