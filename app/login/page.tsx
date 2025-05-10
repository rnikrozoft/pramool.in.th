import React from 'react'

type Props = {}

export default function Login({ }: Props) {
    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-6"></div>
                <div className="col-md-6">
                    <h4 className="text-center">เข้าสู่ระบบ</h4>
                    <form className="needs-validation" noValidate>
                        <div className="mb-3">
                            <label className="form-label"> อีเมล </label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="กรอกอีเมล"
                                required
                            />
                            <div className="invalid-feedback">
                                Please enter a valid email.
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label"> รหัสผ่าน </label>
                            <input type="password" className="form-control" required />
                        </div>
                        <div className="mb-3 form-check">
                            <input type="checkbox" className="form-check-input" />
                            <label className="form-check-label">
                                จดจำการเข้าสู่ระบบ
                            </label>
                        </div>
                        <div className="d-grid gap-2">
                            <button className="btn btn-success" type="submit">
                                เข้าสู่ระบบ
                            </button>
                            <button className="btn btn-outline-primary" type="button">
                                เข้าสู่ระบบด้วย Facebook
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}