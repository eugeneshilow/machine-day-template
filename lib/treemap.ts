export interface TreemapItem {
  id: string
  value: number
}

export interface TreemapRect {
  id: string
  x: number
  y: number
  w: number
  h: number
}

function worstAspect(areas: number[], side: number): number {
  const sum = areas.reduce((a, b) => a + b, 0)
  const max = Math.max(...areas)
  const min = Math.min(...areas)
  const sum2 = sum * sum
  const side2 = side * side
  return Math.max((side2 * max) / sum2, sum2 / (side2 * min))
}

export function squarify(
  items: TreemapItem[],
  x: number,
  y: number,
  w: number,
  h: number
): TreemapRect[] {
  const positive = items.filter((item) => item.value > 0)
  const total = positive.reduce((sum, item) => sum + item.value, 0)
  if (!positive.length || total <= 0 || w <= 0 || h <= 0) return []

  const scale = (w * h) / total
  let rest = [...positive]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ id: item.id, area: item.value * scale }))

  const rects: TreemapRect[] = []
  let cx = x
  let cy = y
  let cw = w
  let ch = h
  let row: Array<{ id: string; area: number }> = []

  const layoutRow = () => {
    const rowArea = row.reduce((sum, r) => sum + r.area, 0)
    if (rowArea <= 0) return
    if (cw >= ch) {
      const stripW = rowArea / ch
      let yy = cy
      for (const r of row) {
        const hh = r.area / stripW
        rects.push({ id: r.id, x: cx, y: yy, w: stripW, h: hh })
        yy += hh
      }
      cx += stripW
      cw -= stripW
    } else {
      const stripH = rowArea / cw
      let xx = cx
      for (const r of row) {
        const ww = r.area / stripH
        rects.push({ id: r.id, x: xx, y: cy, w: ww, h: stripH })
        xx += ww
      }
      cy += stripH
      ch -= stripH
    }
  }

  while (rest.length) {
    const side = Math.min(cw, ch)
    const next = rest[0]
    if (
      !row.length ||
      worstAspect(
        [...row, next].map((r) => r.area),
        side
      ) <=
        worstAspect(
          row.map((r) => r.area),
          side
        )
    ) {
      row.push(next)
      rest = rest.slice(1)
    } else {
      layoutRow()
      row = []
    }
  }
  layoutRow()

  return rects
}
