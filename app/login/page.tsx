import React from 'react'

type Props = {}

export default function Login({ }: Props) {
    return (
        <div className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 md:grid-cols-2">
            <div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="text-center text-2xl font-semibold">เข้าสู่ระบบ</h4>
                <form className="mt-6 space-y-4" noValidate>
                    <div>
                        <label className="mb-1 block text-sm font-medium"> เบอร์โทรศัพท์ </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="08xxxxxxxx"
                            inputMode="numeric"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium"> รหัสผ่าน </label>
                        <input type="password" className="form-input" required />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                        <label className="text-sm text-slate-600">
                            จดจำการเข้าสู่ระบบ
                        </label>
                    </div>
                    <div className="grid gap-2">
                        <button className="btn-primary w-full" type="submit">
                            เข้าสู่ระบบ
                        </button>
                        <button className="btn-outline w-full" type="button">
                            เข้าสู่ระบบด้วย Facebook
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}