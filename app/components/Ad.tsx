import React from "react";
import Image from "next/image";

type Props = {
  title: string;
  image: string;
};

export default function Ad({ title, image }: Props) {
  return (
    <div className="card-elevated p-4 transition hover:shadow-md">
      <div className="grid grid-cols-2 items-center gap-3">
        <div>
          <Image
            src={image}
            width={160}
            height={96}
            unoptimized
            className="h-24 w-full rounded-2xl object-cover ring-1 ring-violet-100"
            alt={title}
          />
        </div>
        <div>
          <h5 className="text-sm font-semibold text-brand-900">{title}</h5>
        </div>
      </div>
    </div>
  );
}
