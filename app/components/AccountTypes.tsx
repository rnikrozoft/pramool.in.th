import React from 'react'

type Props = {}

export default function AccountTypes({ }: Props) {
    return (
        <>
            <div className="mx-auto px-3 pb-6 pt-3 text-center">
                <h1 className="text-4xl font-semibold text-slate-900">ยกระดับบัญชีของคุณ</h1>
                <p className="mt-2 text-lg text-slate-600">
                    เพื่อรับส่วนลดและโปรโมชั่นต่างๆ สำหรับฟีเจอร์พรีเมี่ยมของเรา
                </p>
            </div>
            <div className="mb-8 grid gap-4 text-center md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h4 className="text-xl font-medium">บัญชีทั่วไป</h4>
                    <div className="mt-4">
                        <h1 className="text-4xl font-semibold">
                            $0<small className="text-lg font-light text-slate-500">/mo</small>
                        </h1>
                        <ul className="mt-4 space-y-2 text-sm text-slate-600">
                            <li>10 users included</li>
                            <li>2 GB of storage</li>
                            <li>Email support</li>
                            <li>Help center access</li>
                        </ul>
                        <button type="button" className="btn-outline mt-5 w-full">สมัครใช้งานฟรี</button>
                    </div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                    <h4 className="text-xl font-medium text-blue-700">บัญชีพรีเมี่ยม</h4>
                    <div className="mt-4">
                        <h1 className="text-4xl font-semibold">
                            $29<small className="text-lg font-light text-slate-500">/mo</small>
                        </h1>
                        <ul className="mt-4 space-y-2 text-sm text-slate-600">
                            <li>30 users included</li>
                            <li>15 GB of storage</li>
                            <li>Phone and email support</li>
                            <li>Help center access</li>
                        </ul>
                        <button type="button" className="btn-primary mt-5 w-full">อัพเกรดทันที</button>
                    </div>
                </div>
            </div>
            <h2 className="mb-4 text-center text-3xl font-semibold">เปรียบเทียบความคุ้มค่า</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-center text-sm">
                    <thead className="bg-slate-100">
                        <tr className="text-slate-700">
                            <th className="px-4 py-3 text-left"></th>
                            <th className="px-4 py-3">บัญชีทั่วไป</th>
                            <th className="px-4 py-3">บัญชีพรีเมี่ยม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {["Public", "Private", "Permissions", "Sharing", "Unlimited members", "Extra security"].map((feature) => (
                            <tr key={feature} className="border-t border-slate-200">
                                <th scope="row" className="px-4 py-3 text-left font-medium text-slate-700">{feature}</th>
                                <td className="px-4 py-3 text-emerald-600"><i className="fas fa-check"></i></td>
                                <td className="px-4 py-3 text-emerald-600"><i className="fas fa-check"></i></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}