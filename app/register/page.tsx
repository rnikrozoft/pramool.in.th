"use client"

import Image from "next/image"
import Link from "next/link"
import React, { useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { UserContext } from "../context/UserContext"
import { signup } from "../lib/api/user"
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

/** Optional field: empty is OK; non-empty must look like a normal email address. */
function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function RegisterPage() {
  const router = useRouter()
  const { refreshSession } = useContext(UserContext)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [tel, setTel] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleSocial = (provider: string) => {
    notify("info", `การสมัครด้วย ${provider} จะเปิดให้ใช้งานเร็วๆ นี้`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      notify("error", "กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว")
      return
    }

    const t = tel.trim()
    if (!firstName.trim() || !lastName.trim()) {
      notify("error", "กรุณากรอกชื่อและนามสกุล")
      return
    }
    if (!t) {
      notify("error", "กรุณากรอกหมายเลขโทรศัพท์")
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

    const emailTrim = email.trim()
    if (emailTrim !== "" && !isValidEmailFormat(emailTrim)) {
      notify("error", "รูปแบบอีเมลไม่ถูกต้อง")
      return
    }

    try {
      const res = await signup({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        tel: t,
        email: emailTrim,
        password,
        confirm_password: confirmPassword,
      })
      if (!res.ok) {
        let raw = ""
        try {
          const data = (await res.json()) as { message?: string }
          if (data.message) raw = data.message
        } catch {
          /* ignore */
        }
        notify(
          "error",
          userFacingMessage(raw, "สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่"),
        )
        return
      }

      await refreshSession()
      queueNotify("success", "สมัครสมาชิกสำเร็จ")
      void runPostAuthRedirect(router, { phoneForOnboarding: t })
    } catch {
      notify("error")
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-violet-50/80 via-white to-violet-50/40 pb-16 pt-8 sm:pt-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 xl:px-14 2xl:px-16">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            <h1 className="font-display text-3xl font-bold leading-tight text-brand-700 md:text-4xl lg:text-[2.75rem]">
              สมัครสมาชิก
            </h1>
            <p className="font-display mt-2 text-xl font-semibold text-slate-800 md:text-2xl">
              เริ่มต้นประมูลง่าย ได้ของชัวร์
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 md:text-base">
              เข้าร่วมชุมชนผู้ซื้อและผู้ขายที่โปร่งใส ค้นหาสินค้าคุณภาพและลุ้นราคาที่เหมาะกับคุณ
            </p>
            <ul className="mt-10 space-y-6">
              {features.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-2 ring-brand-100/80">
                    <Icon name={f.icon} aria-hidden />
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
                <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">สร้างบัญชีใหม่</h2>
                <p className="mt-1 text-sm text-slate-600">กรอกข้อมูลเพื่อสมัครสมาชิก</p>
              </div>

              <form className="mt-8 space-y-4" noValidate onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-first" className="mb-1.5 block text-sm font-medium text-slate-700">
                      ชื่อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-first"
                      type="text"
                      autoComplete="given-name"
                      className="form-input"
                      placeholder="ชื่อ"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-last" className="mb-1.5 block text-sm font-medium text-slate-700">
                      นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-last"
                      type="text"
                      autoComplete="family-name"
                      className="form-input"
                      placeholder="นามสกุล"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                      อีเมล
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      className="form-input"
                      placeholder="you@example.com (ไม่บังคับ)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-tel" className="mb-1.5 block text-sm font-medium text-slate-700">
                      หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="reg-tel"
                      type="tel"
                      name="tel"
                      required
                      className="form-input"
                      placeholder="08xxxxxxxx"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      inputMode="numeric"
                      pattern="\d*"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="form-input pr-11"
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
                  <label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-medium text-slate-700">
                    ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="form-input pr-11"
                      placeholder="ยืนยันรหัสผ่าน"
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

                <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  <span>
                    ฉันยอมรับ{" "}
                    <Link href="#" className="font-medium text-brand-600 underline hover:text-brand-700">
                      ข้อกำหนดการใช้งาน
                    </Link>{" "}
                    และ{" "}
                    <Link href="#" className="font-medium text-brand-600 underline hover:text-brand-700">
                      นโยบายความเป็นส่วนตัว
                    </Link>{" "}
                    <span className="text-red-500">*</span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
                >
                  <Icon name="fa-user-plus" className="text-base shrink-0" aria-hidden />
                  สมัครสมาชิก
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs font-medium text-slate-500">
                  <span className="bg-white px-3">หรือสมัครด้วย</span>
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
                มีบัญชีอยู่แล้ว?{" "}
                <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
