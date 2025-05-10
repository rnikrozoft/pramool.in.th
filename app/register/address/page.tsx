import React from 'react'

type Props = {}

export default function address({ }: Props) {
    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-12 col-lg-6">
                    <h4 className="text-center">สมัครสมาชิก</h4>

                    <form>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label">หมายเลขบัตรประชาชน</label>
                                <input type="number" className="form-control" required />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label">เบอร์โทร</label>
                                <input type="number" className="form-control" required />
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="firstName" className="form-label">ชื่อ</label>
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Valid first name is required.
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="lastName" className="form-label">นามสกุล</label>
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Valid last name is required.
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="address2" className="form-label"
                                >ที่อยู่ 1 <span
                                    className="text-body-secondary"
                                ></span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder='บ้านเลขที่ หมู่ที่ หมู่บ้าน'
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="address2" className="form-label"
                                >ที่อยู่ 2 <span
                                    className="text-body-secondary"
                                >(ไม่จำเป็น)</span
                                    ></label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder='อาคาร ชั้น เลขที่ห้อง'
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="address" className="form-label"
                                >ซอย</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Please enter your shipping address.
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="address" className="form-label"
                                >ถนน</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Please enter your shipping address.
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="address" className="form-label"
                                >แขวง/ตำบล</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Please enter your shipping address.
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="address" className="form-label"
                                >เขต/อำเภอ</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Please enter your shipping address.
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="address" className="form-label"
                                >จังหวัด</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Please enter your shipping address.
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label htmlFor="zip" className="form-label"
                                >หมายเลขไปรษณีย์</label
                                >
                                <input
                                    type="number"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Zip code required.
                                </div>
                            </div>
                            {/* <div className="col-md-6">
                                <label htmlFor="cc-name" className="form-label"
                                >Name on card</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <small className="text-body-secondary"
                                >Full name as displayed on card</small
                                >
                                <div className="invalid-feedback">
                                    Name on card is required
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label
                                    htmlFor="cc-number"
                                    className="form-label"
                                >Credit card number</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Credit card number is required
                                </div>
                            </div>

                            <div className="col-md-3">
                                <label
                                    htmlFor="cc-expiration"
                                    className="form-label">Expiration</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Expiration date required
                                </div>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="cc-cvv" className="form-label"
                                >CVV</label
                                >
                                <input
                                    type="text"
                                    className="form-control"
                                />
                                <div className="invalid-feedback">
                                    Security code required
                                </div>
                            </div> */}
                        </div>
                        <button
                            id="next-btn"
                            className="w-100 btn btn-primary btn-lg my-4"
                            type="submit">บันทึกข้อมูล</button
                        >
                    </form>
                </div>
            </div>
        </div>
    )
}