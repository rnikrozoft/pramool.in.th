import dynamic from "next/dynamic";
import Ad from "./components/Ad";
import BannerSlide from "./components/BannerSlide";
import ProductCard from "./components/ProductCard";

/** Below-the-fold: defer chunk until needed so first paint stays light. */
const Features = dynamic(() => import("./components/Features"), {
  loading: () => <div className="h-40 animate-pulse rounded-xl bg-slate-100" aria-hidden />,
});
const AccountTypes = dynamic(() => import("./components/AccountTypes"), {
  loading: () => <div className="h-32 animate-pulse rounded-xl bg-slate-100" aria-hidden />,
});

export default function Home() {
  const ads = [
    { id: 1, title: "เครื่องแต่งกาย", image: "https://placehold.co/99x99" },
    { id: 2, title: "เครื่องประดับ", image: "https://placehold.co/99x99" },
    { id: 3, title: "เครื่องใช้ไฟฟ้า", image: "https://placehold.co/99x99" },
    { id: 4, title: "ของเก่า/ของมือสอง", image: "https://placehold.co/99x99" },
  ];

  const images = [
    {
      id: 1,
      name: "iPhone 16 Pro Max",
      price: "43,290฿",
      image: "https://images.unsplash.com/photo-1549482199-bc1ca6f58502?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      countdown: "2025-03-22T00:00:00Z",
    },
    {
      id: 2,
      name: "Samsung Galaxy S25 Ultra",
      price: "39,900฿",
      image: "https://images.unsplash.com/photo-1635167727782-be17e947648d?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      countdown: "2025-04-01T12:00:00Z",
    },
    {
      id: 3,
      name: "MacBook Pro M3",
      price: "89,900฿",
      image: "https://images.unsplash.com/photo-1621715225783-b361297d0e8f?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      countdown: "2025-05-15T18:30:00Z",
    },
    {
      id: 4,
      name: "iPad Pro M2",
      price: "34,900฿",
      image: "https://images.unsplash.com/photo-1652540492984-c347f10fcbaf?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      countdown: "2025-06-20T10:00:00Z",
    },
    {
      id: 5,
      name: "Sony PlayStation 6",
      price: "25,000฿",
      image: "https://images.unsplash.com/photo-1652540492984-c347f10fcbaf?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      countdown: "2025-07-01T23:59:59Z",
    },
  ];

  const menus = [
    { name: "กระเป๋าสะพาย" }, { name: "เสื้อ" }, { name: "กางเกง" }, { name: "อุปกรณ์อิเล็กทรอนิกส์" }, { name: "นาฬิกา" },
    { name: "รองเท้า" }, { name: "เมนบอร์ด" }, { name: "ซีพียู" }, { name: "รถยนต์" }, { name: "โทรศัพท์มือถือ" },
    { name: "แท็บเล็ต" }, { name: "เครื่องใช้ไฟฟ้า" }, { name: "กล้องถ่ายรูป" }, { name: "เครื่องประดับ" },
    { name: "แว่นตา" }, { name: "กระเป๋าเดินทาง" }, { name: "เสื้อผ้าแฟชั่น" }, { name: "เครื่องสำอาง" },
    { name: "ของเล่นเด็ก" }, { name: "เครื่องมือช่าง" }, { name: "เครื่องกีฬา" }, { name: "อุปกรณ์ตกแต่งบ้าน" },
    { name: "เฟอร์นิเจอร์" }, { name: "เครื่องดนตรี" }, { name: "เครื่องปั่น" }, { name: "จิวเวลรี่" },
    { name: "อาหารเสริม" }, { name: "ผลิตภัณฑ์สุขภาพ" }, { name: "เครื่องใช้ในครัว" }, { name: "อุปกรณ์ตกปลา" },
    { name: "เครื่องนอน" }, { name: "เสื้อกันหนาว" }, { name: "ของขวัญ" }, { name: "เครื่องปริ้นเตอร์" },
    { name: "เครื่องฟอกอากาศ" }, { name: "ของแต่งบ้าน" }, { name: "ปากกาหมึกซึม" }, { name: "ไม้กวาด" },
    { name: "ของขวัญวันเกิด" }, { name: "อุปกรณ์เดินป่า" }, { name: "สัตว์เลี้ยง" }, { name: "อาหารสัตว์เลี้ยง" },
    { name: "ขนมขบเคี้ยว" }, { name: "เครื่องกรองน้ำ" }, { name: "เครื่องสำอางธรรมชาติ" }, { name: "กระเป๋าสตางค์" }
  ];

  return (
    <main className="mt-6">
      <div className="mx-auto max-w-7xl px-4">
        <div>
          <BannerSlide />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {
            ads.map((ad) => (
              <div key={ad.id}>
                <Ad title={ad.title} image={ad.image} />
              </div>
            ))
          }
        </div>
        <div className="my-8 space-y-4">
          <div>
            <h5 className="text-lg font-semibold text-slate-900">Explore your Interests</h5>
            <div
              className="overflow-hidden-scroll mt-3 flex w-full flex-nowrap gap-2 overflow-x-auto"
            >
              {
                menus.map((v, i) => (
                  <button type="button" className="btn-outline shrink-0 text-nowrap" key={i}>
                    {v.name}
                  </button>
                ))
              }
            </div>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {
                images.map((v) => (
                  <div key={v.id}>
                    <ProductCard item={v} />
                  </div>
                ))
              }
            </div>
          </div>
        </div>
        <Features />
        <div className="mt-8">
            <AccountTypes />
        </div>
      </div>
    </main>
  );
}
