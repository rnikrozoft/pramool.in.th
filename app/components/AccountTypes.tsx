import React from 'react'

type Props = {}

export default function AccountTypes({ }: Props) {
    return (
        <>
            <div className="pricing-header p-3 pb-md-4 mx-auto text-center">
                <h1 className="display-4 fw-normal text-body-emphasis">ยกระดับบัญชีของคุณ</h1>
                <p className="fs-5 text-body-secondary">
                    เพื่อรับส่วนลดและโปรโมชั่นต่างๆ สำหรับฟีเจอร์พรีเมี่ยมของเรา
                </p>
            </div>
            <div className="row mb-3 text-center justify-content-center">
                <div className="col-12 col-md-6">
                    <div className="card mb-4 rounded-3 shadow-sm">
                        <div className="card-header py-3">
                            <h4 className="my-0 fw-normal">บัญชีทั่วไป</h4>
                        </div>
                        <div className="card-body">
                            <h1 className="card-title pricing-card-title">
                                $0<small className="text-body-secondary fw-light">/mo</small>
                            </h1>
                            <ul className="list-unstyled mt-3 mb-4">
                                <li>10 users included</li>
                                <li>2 GB of storage</li>
                                <li>Email support</li>
                                <li>Help center access</li>
                            </ul>
                            <button
                                type="button"
                                className="w-100 btn btn-lg btn-outline-primary"
                            >สมัครใช้งานฟรี</button
                            >
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="card mb-4 rounded-3 shadow-sm border-primary">
                        <div className="card-header py-3 text-bg-primary border-primary">
                            <h4 className="my-0 fw-normal">บัญชีพรีเมี่ยม</h4>
                        </div>
                        <div className="card-body">
                            <h1 className="card-title pricing-card-title">
                                $29<small className="text-body-secondary fw-light">/mo</small>
                            </h1>
                            <ul className="list-unstyled mt-3 mb-4">
                                <li>30 users included</li>
                                <li>15 GB of storage</li>
                                <li>Phone and email support</li>
                                <li>Help center access</li>
                            </ul>
                            <button type="button" className="w-100 btn btn-lg btn-primary"
                            >อัพเกรดทันที</button
                            >
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="display-6 text-center mb-4">เปรียบเทียบความคุ้มค่า</h2>

            <div className="table-responsive">
                <table className="table text-center">
                    <thead>
                        <tr>
                            <th style={{ width: `33%` }}></th>
                            <th style={{ width: `33%` }}>บัญชีทั่วไป</th>
                            <th style={{ width: `33%` }}>บัญชีพรีเมี่ยม</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row" className="text-start">Public</th>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-start">Private</th>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                        </tr>
                    </tbody>

                    <tbody>
                        <tr>
                            <th scope="row" className="text-start">Permissions</th>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-start">Sharing</th>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-start">Unlimited members</th>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" className="text-start"> Extra security </th>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                            <td>
                                <i className="fas fa-check"></i>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}