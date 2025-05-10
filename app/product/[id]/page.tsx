import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

type Props = {}

export default function Product({ }: Props) {
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href={`/`}>Home</Link></li>
              <li className="breadcrumb-item"><a href="#">Library</a></li>
              <li className="breadcrumb-item active" aria-current="page">
                Data
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="row mt-3">
        <div className="col-12 col-md-7">
          <div
            id="carouselExample"
            className="carousel slide"
            data-bs-ride="carousel"
          >
            <div className="carousel-inner">
              <div className="carousel-item active">
                <Image
                  src={`/photo1.png`}
                  className="d-block w-100"
                  width={`400`}
                  height={`500`}
                  alt="Slide 1"
                />
              </div>
              <div className="carousel-item">
                <img
                  src="https://placehold.co/600x400/orange/white"
                  className="d-block w-100"
                  alt="Slide 2"
                />
              </div>
              <div className="carousel-item">
                <img
                  src="https://placehold.co/600x400/transparent/F00"
                  className="d-block w-100"
                  alt="Slide 3"
                />
              </div>
            </div>

            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#carouselExample"
              data-bs-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#carouselExample"
              data-bs-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>

          <div className="d-flex justify-content-center mt-3">
            <Image
              src={`/photo1.png`}
              className="img-thumbnail mx-1"
              width="100"
              height="50"
              data-bs-target="#carouselExample"
              data-bs-slide-to="0"
              alt=''
            />
            <img
              src="https://placehold.co/600x400/orange/white"
              className="img-thumbnail mx-1"
              width="100"
              height="50"
              data-bs-target="#carouselExample"
              data-bs-slide-to="1"
            />
            <img
              src="https://placehold.co/600x400/transparent/F00"
              className="img-thumbnail mx-1"
              width="100"
              height="50"
              data-bs-target="#carouselExample"
              data-bs-slide-to="2"
            />
          </div>

          <div className="mt-5">
            <h1>Products ID: 123</h1>
            <p>ชื่อ: Iphone</p>
            <p>Email: rnikrozoft@gmail.com</p>
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing
              elit. Ipsam natus ut architecto quisquam, nihil
              necessitatibus minima, iusto officiis veniam assumenda
              repudiandae! Laborum eum molestias dolores? Eveniet
              saepe ipsum enim, assumenda commodi fuga odio aliquam,
              nemo fugit error tempora excepturi reiciendis hic
              architecto ducimus expedita labore ut modi? Animi qui
              mollitia porro molestias omnis magnam enim quisquam
              iusto repellat eaque nostrum recusandae eos iste quam
              excepturi aperiam iure voluptate, voluptatum veniam
              temporibus. Quidem voluptates, numquam animi saepe
              nostrum similique ut iste deserunt non, minima vel
              accusamus temporibus odio sequi ducimus debitis aperiam
              ipsa atque repudiandae illo molestiae vero velit
              provident aspernatur.
            </p>
          </div>
        </div>
        <div className="col-12 col-md-5">
          <h5>
            Apple Pencil (1st Generation): Pixel-Perfect Precision and
            Industry-Leading Low Latency, Perfect for Note-Taking,
            Drawing, and Signing documents.
          </h5>
          <div className="py-3 sticky-top">
            <div className="card">
              <div className="card-body">
                <div className="row row-gap-2">
                  <div className="col-2">
                    <img
                      className="rounded-circle w-100"
                      alt="avatar1"
                      src="https://mdbcdn.b-cdn.net/img/new/avatars/9.webp"
                    />
                  </div>
                  <div className="col-auto justify-content-center">
                    จิรวัฒน์ จรูญเนตร
                    <p className="m-0 p-0">คะแนนโดยรวม 8/10</p>
                  </div>
                  <div className="col-auto">
                    <span
                      className="badge rounded-pill text-bg-primary"
                    >Primary</span
                    >
                    <span
                      className="badge rounded-pill text-bg-secondary"
                    >Secondary</span
                    >
                    <span
                      className="badge rounded-pill text-bg-success"
                    >Success</span
                    >
                    <span
                      className="badge rounded-pill text-bg-danger"
                    >Danger</span
                    >
                    <span
                      className="badge rounded-pill text-bg-warning"
                    >Warning</span
                    >
                    <span
                      className="badge rounded-pill text-bg-info"
                    >Info</span
                    >
                    <span
                      className="badge rounded-pill text-bg-light"
                    >Light</span
                    >
                    <span
                      className="badge rounded-pill text-bg-dark"
                    >Dark</span
                    >
                  </div>
                </div>
                <div className="row mt-5">
                  <div className="col-12">
                    <h4 className="card-title">
                      ราคาล่าสุด 89,000 บาท
                    </h4>
                    <div className="d-grid gap-2">
                      <div className="input-group input-group-lg">
                        <span
                          className="input-group-text"
                          id="basic-addon3"
                        >
                          ราคาบิด
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          id="basic-url"
                          aria-describedby="basic-addon3 basic-addon4"
                          value="120"
                          readOnly
                        />
                      </div>
                      <div
                        className="form-text"
                        id="basic-addon4"
                      >
                        บิดครั้งละ 120 บาท
                      </div>
                      <button
                        className="btn btn-success btn-lg"
                        type="button"
                        data-countdown="2025-03-22T00:00:00Z"
                      >
                        เสนอราคา 89,120
                        <p
                          className="small m-0 mt-3 p-0 text-light"
                        >
                          จบลงในอีก <span
                            className="countdown"></span>
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}