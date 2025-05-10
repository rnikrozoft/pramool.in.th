import React, { useState, useEffect } from 'react';

type Props = {
    errorMessage: string;
    color: string;
};

export default function AlertOnTopEnd({ errorMessage, color }: Props) {
    const [showAlert, setShowAlert] = useState(true);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setShowAlert(false); // ซ่อน alert หลังจาก 5 วินาที
            }, 5000); // 5000 มิลลิวินาที = 5 วินาที

            // เคลียร์ timer เมื่อ component ถูก unmount หรือ errorMessage เปลี่ยน
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    return (
        <>
            {showAlert && (
                <div className={`alert alert-${color} position-fixed top-0 end-0 m-3`} role="alert">
                    {errorMessage}
                </div>
            )}
        </>
    );
}
