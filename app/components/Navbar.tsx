import Link from 'next/link'
import React from 'react'

export default function Navbar() {
    return (
        <>
            <nav className="navbar navbar-expand-lg bg-body-tertiary">
                <div className="container d-block">
                    <div className="row d-lg-none">
                        <div className="col-auto">
                            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                                <span className="navbar-toggler-icon"></span>
                            </button>
                        </div>
                        <div className="col">
                            <div className="input-group">
                                <input type="text" className="form-control" placeholder="ค้นหาสินค้า" aria-label="Recipient's username" aria-describedby="basic-addon2" />
                                <span className="input-group-text" id="basic-addon2">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="collapse navbar-collapse w-100 d-lg-flex justify-content-between" id="navbarNav">
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link className="nav-link active" aria-current="page" href={`/`}>Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" href="#">Features</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" href="#">Pricing</Link>
                            </li>
                            <li className="nav-item">
                                <Link href={`/`} className="nav-link disabled" aria-disabled="true">Disabled</Link>
                            </li>
                        </ul>
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link href={`/login`} className='nav-link link-body-emphasis'>เข้าสู่ระบบ</Link>
                            </li>
                            <li className="nav-item">
                                <Link href={`/register`} className='nav-link link-body-emphasis'>สมัครสมาชิก</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            <header className="py-3 mb-4 border-bottom d-none d-lg-block sticky-top bg-white">
                <div className="container">
                    <div className="row">
                        <div className="col-auto align-content-center">
                            <Link
                                href="/"
                                className="link-body-emphasis text-decoration-none"
                            >
                                <img
                                    src="/bootstrap-logo-shadow.png"
                                    width="40"
                                    height="32"
                                    alt="Bootstrap"
                                    className="me-2"
                                />
                                <span className="fs-4">Pramool</span>
                            </Link>
                        </div>
                        <div className="col">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="ค้นหาสินค้า"
                                aria-label="Search"
                            />
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}