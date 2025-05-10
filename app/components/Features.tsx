import React from 'react'

type Props = {}

export default function Features({ }: Props) {
    return (
        <>
            <h2 className="pb-2 border-bottom">ทำไมต้องใช้ PRAMOOL.IN.TH</h2>

            <div className="row align-items-md-center gy-5 py-md-5 py-3">
                <div className="col-12 col-md d-flex flex-column align-items-start gap-2">
                    <h2 className="fw-bold text-body-emphasis">บริการของเรา</h2>
                    <p className="text-body-secondary">
                        Paragraph of text beneath the heading to explain the heading. We'll
                        add onto it with another sentence and probably just keep going until
                        we run out of words.
                    </p>
                    <a href="#" className="btn btn-primary btn-lg">สมัครสมาชิก</a>
                </div>

                <div className="col-12 col-md">
                    <div className="row row-cols-1 row-cols-sm-2 g-4">
                        <div className="col d-flex flex-column gap-2">
                            <div
                                className="feature-icon-small d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-4 rounded-3"
                            >
                                <svg className="bi" width="1em" height="1em">
                                    <use xlinkHref="#collection"></use>
                                </svg>
                            </div>
                            <h4 className="fw-semibold mb-0 text-body-emphasis">
                                ทำให้คุณตัดสินใจได้ง่ายและเร็วขึ้น
                            </h4>
                            <p className="text-body-secondary">
                                Paragraph of text beneath the heading to explain the
                                heading.
                            </p>
                        </div>

                        <div className="col d-flex flex-column gap-2">
                            <div
                                className="feature-icon-small d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-4 rounded-3"
                            >
                                <svg className="bi" width="1em" height="1em">
                                    <use xlinkHref="#gear-fill"></use>
                                </svg>
                            </div>
                            <h4 className="fw-semibold mb-0 text-body-emphasis">
                                ป้องกันการโกง และติดตามได้อย่างแม่นยำ
                            </h4>
                            <p className="text-body-secondary">
                                Paragraph of text beneath the heading to explain the
                                heading.
                            </p>
                        </div>

                        <div className="col d-flex flex-column gap-2">
                            <div
                                className="feature-icon-small d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-4 rounded-3"
                            >
                                <svg className="bi" width="1em" height="1em">
                                    <use xlinkHref="#speedometer"></use>
                                </svg>
                            </div>
                            <h4 className="fw-semibold mb-0 text-body-emphasis">
                                ป้องกันการเปิดประมูล/บิด โดยที่ไม่ได้ตั้งใจ
                            </h4>
                            <p className="text-body-secondary">
                                Paragraph of text beneath the heading to explain the
                                heading.
                            </p>
                        </div>

                        <div className="col d-flex flex-column gap-2">
                            <div
                                className="feature-icon-small d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-4 rounded-3"
                            >
                                <i className="fas fa-money-bill-wave"></i>
                            </div>
                            <h4 className="fw-semibold mb-0 text-body-emphasis">
                                ยกระดับการประมูล
                            </h4>
                            <p className="text-body-secondary">
                                Paragraph of text beneath the heading to explain the
                                heading.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}