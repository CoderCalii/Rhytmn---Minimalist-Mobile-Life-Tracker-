type WeeklyGridProps = {
  days: string[]
  values: number[]
}

export function WeeklyGrid({ days, values }: WeeklyGridProps) {
  return (
    <div>
      <div>
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div>
        {values.map((value, index) => (
          <div key={index} data-active={value > 0} />
        ))}
      </div>
    </div>
  )
}
