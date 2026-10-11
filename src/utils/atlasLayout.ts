export function fitAtlasPins(points: { id: string; x: number; y: number }[], width: number, height: number, compact: boolean) {
  const w = compact ? 44 : 166, h = 44, gap = 6, occupied: { x: number; y: number }[] = [];
  const fitted = points.map(point => {
    const target = { x: point.x * width / 100, y: point.y * height / 100 };
    const candidates = [{ x: Math.max(w / 2 + 4, Math.min(width - w / 2 - 4, target.x)), y: Math.max(h / 2 + 4, Math.min(height - h / 2 - 4, target.y)) }];
    for (let y = h / 2 + 4; y <= height - h / 2 - 4; y += 8) for (let x = w / 2 + 4; x <= width - w / 2 - 4; x += 8) candidates.push({ x, y });
    let best: { x: number; y: number } | undefined, distance = Infinity;
    for (const p of candidates) {
      if (p.x < w / 2 + 4 || p.x > width - w / 2 - 4 || p.y < h / 2 + 4 || p.y > height - h / 2 - 4) continue;
      if (occupied.some(other => Math.abs(p.x - other.x) < w + gap && Math.abs(p.y - other.y) < h + gap)) continue;
      const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
      if (d < distance) { best = p; distance = d; }
    }
    if (best) occupied.push(best);
    return { ...point, ...(best ?? target), visible: !!best };
  });
  if (fitted.every(p=>p.visible)) return fitted;
  // On a small screen, an even grid guarantees space for every landmark. Match
  // the closest point/cell pairs rather than hiding the remaining destinations.
  const cols = Math.floor((width + gap - 8) / (w + gap)), rows = Math.floor((height + gap - 8) / (h + gap));
  if (!cols || !rows || cols * rows < points.length) return fitted;
  const cells = Array.from({length:cols*rows},(_,i)=>({x:w/2+4+(i%cols)*(width-w-8)/Math.max(1,cols-1),y:h/2+4+Math.floor(i/cols)*(height-h-8)/Math.max(1,rows-1)}));
  const remaining = [...points], assigned = new Map<string,{x:number;y:number}>();
  while(remaining.length) {
    let pi=0,ci=0,distance=Infinity;
    remaining.forEach((point,i)=>cells.forEach((cell,j)=>{const d=(cell.x-point.x*width/100)**2+(cell.y-point.y*height/100)**2;if(d<distance){pi=i;ci=j;distance=d;}}));
    assigned.set(remaining[pi].id,cells[ci]);remaining.splice(pi,1);cells.splice(ci,1);
  }
  return points.map(point=>({...point,...assigned.get(point.id)!,visible:true}));
}
