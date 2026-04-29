import React from 'react'

type Props = {}

export default function Features({ }: Props) {
    return (
        <>
            <h2 className="border-b border-slate-200 pb-2 text-2xl font-bold text-slate-900">ทำไมต้องใช้ PRAMOOL.IN.TH</h2>
            <div className="grid items-start gap-8 py-6 md:grid-cols-2 md:py-10">
                <div className="flex flex-col items-start gap-3">
                    <h2 className="text-3xl font-bold text-slate-900">บริการของเรา</h2>
                    <p className="text-slate-600">
                        Paragraph of text beneath the heading to explain the heading. We'll
                        add onto it with another sentence and probably just keep going until
                        we run out of words.
                    </p>
                    <a href="#" className="btn-primary">สมัครสมาชิก</a>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                        "ทำให้คุณตัดสินใจได้ง่ายและเร็วขึ้น",
                        "ป้องกันการโกง และติดตามได้อย่างแม่นยำ",
                        "ป้องกันการเปิดประมูล/บิด โดยที่ไม่ได้ตั้งใจ",
                        "ยกระดับการประมูล",
                    ].map((title) => (
                        <div key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <i className="fas fa-star"></i>
                            </div>
                            <h4 className="mb-1 font-semibold text-slate-900">{title}</h4>
                            <p className="text-sm text-slate-600">Paragraph of text beneath the heading to explain the heading.</p>
                        </div>
                    ))}
                    </div>
            </div>
        </>
    )
}