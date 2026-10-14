export default function SetPicker({ sets, value, onChange }) {
  return (
    <select className="set-picker" value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label="Sada">
      {sets.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
