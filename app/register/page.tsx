'use client'
import React, { useState } from 'react'

type Props = {}

export default function Register({ }: Props) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirm_password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3001/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Registration successful", result);
            } else {
                console.log("Registration failed",response);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-6"></div>
                <div className="col-md-6">
                    <h4 className="text-center">สมัครสมาชิก</h4>
                    <form className="needs-validation" noValidate onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label"> อีเมล </label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="กรอกอีเมล"
                                required
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <div className="invalid-feedback">
                                Please enter a valid email.
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label"> รหัสผ่าน </label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label"> ยืนยันรหัสผ่าน </label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="d-grid gap-2">
                            <button className="btn btn-success" type="submit">
                                สมัครสมาชิก
                            </button>
                            <button
                                className="btn btn-outline-primary"
                                type="button"
                            >
                                สมัครสมาชิกผ่าน Facebook
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}