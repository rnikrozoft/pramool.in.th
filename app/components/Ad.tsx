import React from 'react'

type Props = {
    title: string,
    image: string
}

export default function Ad({ title, image }: Props) {
    return (
        <div className="card mb-3" style={{maxWidth: `540px`}}>
            <div className="row g-0">
                <div className="col-6 col-md-4">
                    <img src={image} className="img-fluid rounded-start" alt="..." />
                </div>
                <div className="col-6 col-md-8 align-content-center">
                    <div className="card-body">
                        <h5 className="card-title">{title}</h5>
                    </div>
                </div>
            </div>
        </div>
    )
}