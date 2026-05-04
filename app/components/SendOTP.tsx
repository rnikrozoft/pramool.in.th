'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useCountdownTimer from './OTPCountdown';
import { callPostAPI } from '../lib/utils/call-api';
import { userFacingMessage } from '../lib/utils/userFacingMessage';

interface OTPFormProps {
    token: string;
    setShowPinModal: (show: boolean) => void;
}

const OTP_LENGTH = Number(process.env.OTP_LENGTH) || 6;
const OTP_TIMER_DURATION_MINUTES = 0.5;

export default function OTPForm({ token, setShowPinModal }: OTPFormProps) {
    const { formattedTime, start, timeRemaining } = useCountdownTimer(OTP_TIMER_DURATION_MINUTES);
    const [pin, setPin] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => { start() }, [start]);

    useEffect(() => {
        if (timeRemaining === 0) {
            setShowPinModal(false);
        }
    }, [timeRemaining, setShowPinModal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError(null);

        if (pin.length !== OTP_LENGTH) {
            setError(`กรุณากรอก OTP ให้ครบ ${OTP_LENGTH} หลัก`);
            return;
        }

        try {
            const response = await callPostAPI('/verify-otp', { token, pin })
            if (response.ok) {
                router.push('/');
                return;
            }

            const errorData = await response.json() as { message?: string };
            setError(
                userFacingMessage(
                    errorData.message,
                    "รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่",
                ),
            );
        } catch (err) {
            console.error('An error occurred during OTP verification:', err);
            setError('ยืนยัน OTP ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" tabIndex={-1}>
            <div className="w-full max-w-md">
                <form className="rounded-xl bg-white p-5 shadow-xl" onSubmit={handleSubmit}>
                    <div className="mb-3 flex items-center justify-between">
                        <h5 className="text-lg font-semibold text-slate-900">กรุณากรอกรหัส OTP</h5>
                        <button
                            type="button"
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                            onClick={() => setShowPinModal(false)}
                            aria-label="Close"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div>
                        <div className="mb-4">
                            <input
                                type="text"
                                maxLength={OTP_LENGTH}
                                className="form-input"
                                placeholder="รหัส OTP"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                required
                                name="pin"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                            {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
                        </div>
                        <p className="text-sm text-slate-500">เหลือเวลา: {formattedTime}</p>
                    </div>
                    <div className="mt-5 flex justify-end">
                        <button type="submit" className="btn-primary" disabled={pin.length !== OTP_LENGTH}>
                            ยืนยัน
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
