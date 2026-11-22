// Pull research-grade, openly licensed photos from iNaturalist into a manifest.
// Usage: node scripts/fetch-photos.mjs   (writes src/data/photos.json)
// Re-running keeps any `region` / `exclude` edits made with the #/annotate tool.
import { readFile, writeFile } from 'node:fs/promises'

const SPECIES = [
  { key: 'downy', taxonId: 792988 },
  { key: 'hairy', taxonId: 1651487 },
  { key: 'house', taxonId: 199840 },
  { key: 'purple', taxonId: 199841 },
  { key: 'coopers', taxonId: 1579017 },
  { key: 'sharpie', taxonId: 5097 },
]
const PER_SPECIES = 30
const LICENSES = ['cc0', 'cc-by', 'cc-by-nc']
const OUT = new URL('../src/data/photos.json', import.meta.url)

async function fetchSpecies({ key, taxonId }) {
  const params = new URLSearchParams({
    taxon_id: String(taxonId),
    quality_grade: 'research',
    photo_license: LICENSES.join(','),
    photos: 'true',
    order_by: 'votes',
    per_page: '60',
  })
  const res = await fetch(`https://api.inaturalist.org/v1/observations?${params}`)
  if (!res.ok) throw new Error(`iNaturalist ${res.status} for ${key}`)
  const { results } = await res.json()

  const photos = []
  const perUser = new Map()
  for (const obs of results) {
    const p = obs.photos.find((ph) => LICENSES.includes(ph.license_code))
    if (!p) continue
    // At most 3 photos per photographer, so the set varies in angle and lighting.
    const n = perUser.get(obs.user.login) ?? 0
    if (n >= 3) continue
    perUser.set(obs.user.login, n + 1)
    photos.push({
      id: `${key}-${p.id}`,
      species: key,
      url: p.url.replace('/square.', '/medium.'),
      largeUrl: p.url.replace('/square.', '/large.'),
      attribution: p.attribution,
      license: p.license_code,
      observationUrl: `https://www.inaturalist.org/observations/${obs.id}`,
    })
    if (photos.length === PER_SPECIES) break
  }
  return photos
}

let previous = []
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'))
} catch {
  // first run
}
const kept = new Map(previous.map((p) => [p.id, p]))

const all = []
for (const s of SPECIES) {
  for (const p of await fetchSpecies(s)) {
    const old = kept.get(p.id)
    all.push(old ? { ...p, region: old.region, exclude: old.exclude } : p)
  }
}
await writeFile(OUT, JSON.stringify(all, null, 2) + '\n')
console.log(`wrote ${all.length} photos`)
