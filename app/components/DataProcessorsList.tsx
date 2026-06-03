import type { DataProcessorItem } from "@/app/lib/api/privacy";

type DataProcessorsListProps = {
    items: DataProcessorItem[];
};

export default function DataProcessorsList({ items }: DataProcessorsListProps) {
    if (items.length === 0) {
        return <p className="text-sm text-muted">ไม่มีรายการผู้ประมวลผลข้อมูลในขณะนี้</p>;
    }

    return (
        <ul className="space-y-4">
            {items.map((item) => (
                <li key={item.name} className="rounded-lg border border-slate-200/80 bg-surface/50 p-4 dark:border-slate-700/80">
                    <p className="font-semibold text-heading">{item.name}</p>
                    <dl className="mt-2 space-y-1 text-sm text-body">
                        <div>
                            <dt className="inline font-medium text-label">วัตถุประสงค์: </dt>
                            <dd className="inline">{item.purpose}</dd>
                        </div>
                        <div>
                            <dt className="inline font-medium text-label">ข้อมูลที่ส่ง: </dt>
                            <dd className="inline">{item.data_categories}</dd>
                        </div>
                        {item.location ? (
                            <div>
                                <dt className="inline font-medium text-label">ที่ตั้งการประมวลผล: </dt>
                                <dd className="inline">{item.location}</dd>
                            </div>
                        ) : null}
                    </dl>
                    {item.privacy_url ? (
                        <p className="mt-2 text-sm">
                            <a
                                href={item.privacy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-600 underline dark:text-brand-400"
                            >
                                นโยบายความเป็นส่วนตัวของผู้ให้บริการ
                            </a>
                        </p>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}
