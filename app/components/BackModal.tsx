import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import React from 'react'

type Props = {
    isOpen: boolean
    onClose: () => void
}

export default function BackModal({ isOpen, onClose }: Props) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-xl bg-surface-card p-5 shadow-lg dark:shadow-black/40">
                    <DialogTitle className="text-lg font-semibold text-heading">ย้อนการบิดล่าสุด</DialogTitle>
                    <p className="mt-3 text-sm text-body">
                        ระบบจะยกเลิกรายการบิดล่าสุดของคุณในรายการนี้
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={onClose}>ปิด</button>
                        <button type="button" className="btn-primary" onClick={onClose}>ยืนยัน</button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    )
}