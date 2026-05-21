'use client'

import { useId } from 'react'

type LocalizedFilePickerProps = {
  buttonLabel: string
  emptyLabel: string
  selectedLabel: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onChange: (files: File[]) => void
}

export default function LocalizedFilePicker({
  buttonLabel,
  emptyLabel,
  selectedLabel,
  accept,
  multiple = false,
  disabled = false,
  onChange,
}: LocalizedFilePickerProps) {
  const inputId = useId()

  return (
    <div className="mt-3">
      <label
        htmlFor={inputId}
        className={[
          'flex min-h-[62px] cursor-pointer items-center gap-4 rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] transition',
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-[var(--blue)] hover:bg-white',
        ].join(' ')}
      >
        <span className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white">
          {buttonLabel}
        </span>
        <span className="min-w-0 flex-1 truncate text-[var(--muted)]">
          {selectedLabel || emptyLabel}
        </span>
      </label>

      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => onChange(Array.from(event.target.files || []))}
        className="sr-only"
      />
    </div>
  )
}
