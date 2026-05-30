"use client"

import React from "react"
import {
  allSubDistrictOptions,
  emptyAddressLocation,
  syncFromDistrict,
  syncFromProvince,
  syncFromSubDistrict,
  type AddressLocationValue,
} from "@/app/lib/locationCascade"
import {
  DistrictSelect,
  ProvinceSelect,
  SearchableSelect,
  ZipcodeInput,
} from "@/app/components/LocationSelector"

export type AddressLocationFieldErrors = Partial<{
  subDistrictId: string
  districtId: string
  provinceId: string
  zipcode: string
}>

type Props = {
  value: AddressLocationValue
  onChange: (next: AddressLocationValue) => void
  errors?: AddressLocationFieldErrors
}

export default function AddressLocationFields({ value, onChange, errors = {} }: Props) {
  const { subDistrictId, districtId, provinceId, zipcode } = value

  const handleSubDistrictChange = (id: number | null) => {
    if (!id) {
      onChange(emptyAddressLocation())
      return
    }
    onChange(syncFromSubDistrict(id))
  }

  const handleDistrictChange = (id: number | null) => {
    if (!id) {
      onChange({
        ...value,
        districtId: null,
        provinceId: null,
        subDistrictId: null,
        zipcode: "",
      })
      return
    }
    onChange(syncFromDistrict(id, subDistrictId))
  }

  const handleProvinceChange = (id: number | null) => {
    if (!id) {
      onChange(emptyAddressLocation())
      return
    }
    onChange(syncFromProvince(id))
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-label">
          แขวง/ตำบล <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          options={allSubDistrictOptions}
          value={subDistrictId}
          onChange={handleSubDistrictChange}
          placeholder="ค้นหาแขวง/ตำบล (เช่น ชื่อตำบล อำเภอ จังหวัด)"
        />
        {errors.subDistrictId ? (
          <p className="mt-1 text-xs text-red-500">{errors.subDistrictId}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-label">
          เขต/อำเภอ <span className="text-red-500">*</span>
        </label>
        <DistrictSelect
          provinceId={provinceId}
          value={districtId}
          onChange={handleDistrictChange}
          disabled={!subDistrictId}
        />
        {errors.districtId ? (
          <p className="mt-1 text-xs text-red-500">{errors.districtId}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-label">
          จังหวัด <span className="text-red-500">*</span>
        </label>
        <ProvinceSelect
          districtId={districtId}
          value={provinceId}
          onChange={handleProvinceChange}
          disabled={!districtId}
        />
        {errors.provinceId ? (
          <p className="mt-1 text-xs text-red-500">{errors.provinceId}</p>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-label">
          รหัสไปรษณีย์ <span className="text-red-500">*</span>
        </label>
        <ZipcodeInput value={zipcode} onChange={() => {}} readOnly />
        <p className="mt-1 text-xs text-muted">กรอกอัตโนมัติเมื่อเลือกแขวง/ตำบล</p>
        {errors.zipcode ? <p className="mt-1 text-xs text-red-500">{errors.zipcode}</p> : null}
      </div>
    </div>
  )
}
