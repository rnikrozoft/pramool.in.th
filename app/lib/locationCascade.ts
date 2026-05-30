import subDistricts from "@/app/data/sub-districts.json"
import districts from "@/app/data/districts.json"
import provinces from "@/app/data/provinces.json"

export type AddressLocationValue = {
  subDistrictId: number | null
  districtId: number | null
  provinceId: number | null
  zipcode: string
}

const districtById = new Map(districts.map((d) => [d.district_id, d]))
const provinceById = new Map(provinces.map((p) => [p.province_id, p]))

/** ตำบลทั้งหมด — dropdown แสดง ตำบล·อำเภอ·จังหวัด, ช่อง input หลังเลือกแสดงแค่ชื่อตำบล */
export const allSubDistrictOptions = subDistricts.map((s) => {
  const district = districtById.get(s.district_id)
  const province = district ? provinceById.get(district.province_id) : undefined
  const dropdownLabel =
    district && province
      ? `${s.name_th} · ${district.name_th} · ${province.name_th}`
      : s.name_th
  return {
    id: s.subdistrict_id,
    label: dropdownLabel,
    displayLabel: s.name_th,
  }
})

export function syncFromSubDistrict(subDistrictId: number): AddressLocationValue {
  const sub = subDistricts.find((s) => s.subdistrict_id === subDistrictId)
  if (!sub) {
    return { subDistrictId, districtId: null, provinceId: null, zipcode: "" }
  }
  const district = districtById.get(sub.district_id)
  const provinceId = district?.province_id ?? null
  return {
    subDistrictId,
    districtId: sub.district_id,
    provinceId,
    zipcode: String(sub.zipcode).padStart(5, "0").slice(0, 5),
  }
}

export function syncFromDistrict(
  districtId: number,
  currentSubDistrictId: number | null,
): AddressLocationValue {
  const district = districtById.get(districtId)
  if (!district) {
    return { subDistrictId: null, districtId, provinceId: null, zipcode: "" }
  }

  let subDistrictId = currentSubDistrictId
  let zipcode = ""

  if (currentSubDistrictId) {
    const sub = subDistricts.find((s) => s.subdistrict_id === currentSubDistrictId)
    if (sub && sub.district_id === districtId) {
      zipcode = String(sub.zipcode).padStart(5, "0").slice(0, 5)
    } else {
      subDistrictId = null
    }
  }

  return {
    subDistrictId,
    districtId,
    provinceId: district.province_id,
    zipcode,
  }
}

export function syncFromProvince(provinceId: number): AddressLocationValue {
  return {
    subDistrictId: null,
    districtId: null,
    provinceId,
    zipcode: "",
  }
}

export function emptyAddressLocation(): AddressLocationValue {
  return {
    subDistrictId: null,
    districtId: null,
    provinceId: null,
    zipcode: "",
  }
}
