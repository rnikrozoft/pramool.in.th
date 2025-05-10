import React from 'react'

export default function BannerSlide() {
    return (
        <div id="carouselExampleCaptions" className="carousel slide">
            <div className="carousel-indicators">
                <button
                    type="button"
                    data-bs-target="#carouselExampleCaptions"
                    data-bs-slide-to="0"
                    className="active"
                    aria-current="true"
                    aria-label="Slide 1"></button>
                <button
                    type="button"
                    data-bs-target="#carouselExampleCaptions"
                    data-bs-slide-to="1"
                    aria-label="Slide 2"></button>
                <button
                    type="button"
                    data-bs-target="#carouselExampleCaptions"
                    data-bs-slide-to="2"
                    aria-label="Slide 3"></button>
            </div>
            <div className="carousel-inner">
                <div className="carousel-item active">
                    <img
                        src="https://images.unsplash.com/photo-1713492664635-1363f44734ef?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        className="d-block banner-slide object-fit-cover rounded"
                        alt="..."
                    />
                    <div className="carousel-caption d-none d-md-block">
                        <h5>First slide label</h5>
                        <p>
                            Some representative placeholder content for the first slide.
                        </p>
                    </div>
                </div>
                <div className="carousel-item">
                    <img
                        src="https://images.unsplash.com/photo-1644462982538-ee5ce6abd2db?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        className="d-block banner-slide object-fit-cover rounded"
                        alt="..."
                    />
                    <div className="carousel-caption d-none d-md-block">
                        <h5>Second slide label</h5>
                        <p>
                            Some representative placeholder content for the second
                            slide.
                        </p>
                    </div>
                </div>
                <div className="carousel-item">
                    <img
                        src="https://images.unsplash.com/photo-1548874468-025d0edfdf8b?q=80&w=320&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        className="d-block banner-slide object-fit-cover rounded"
                        alt="..."
                    />
                    <div className="carousel-caption d-none d-md-block">
                        <h5>Third slide label</h5>
                        <p>
                            Some representative placeholder content for the third slide.
                        </p>
                    </div>
                </div>
            </div>
            <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselExampleCaptions"
                data-bs-slide="prev"
            >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
            </button>
            <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#carouselExampleCaptions"
                data-bs-slide="next"
            >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
            </button>
        </div>
    )
}