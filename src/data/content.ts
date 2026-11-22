import rawPhotos from './photos.json'

export type SpeciesKey = 'downy' | 'hairy' | 'house' | 'purple' | 'coopers' | 'sharpie'

export interface Region {
  // Normalized 0–1 coordinates of the diagnostic area within the photo.
  x: number
  y: number
  w: number
  h: number
  label?: string
}

export interface Photo {
  id: string
  species: SpeciesKey
  url: string
  largeUrl: string
  attribution: string
  license: string
  observationUrl: string
  region?: Region
  exclude?: boolean
}

export interface Species {
  key: SpeciesKey
  name: string
  latin: string
  // One line per row of the pair's comparison table, keyed by Pair.traits[].key.
  traits: Record<string, string>
  // Photo shown on the primer card; falls back to an annotated photo.
  primerPhoto?: string
}

export interface FieldMark {
  key: string
  label: string
  // Diagnostic marks reliably separate the pair; others get a "why not" note.
  diagnostic: boolean
  note: string
}

export interface Pair {
  key: string
  title: string
  short: string
  question: string
  lede: string
  rule: string
  traits: { key: string; label: string }[]
  species: [Species, Species]
  marks: FieldMark[]
}

export const WOODPECKERS: Pair = {
  key: 'woodpeckers',
  title: 'Downy vs. Hairy Woodpecker',
  short: 'Woodpeckers',
  question: 'Which woodpecker is this?',
  lede: 'Same black-and-white pattern, same red patch on males. Ignore all of that and look at two things.',
  rule:
    'If the bill looks about as long as the head is deep, it’s a Hairy. If it looks like a short thorn, it’s a Downy. Don’t trust size — in a photo there is nothing to compare it with.',
  traits: [
    { key: 'bill', label: 'Bill' },
    { key: 'tail', label: 'Outer tail' },
  ],
  species: [
    {
      key: 'downy',
      name: 'Downy Woodpecker',
      latin: 'Dryobates pubescens',
      traits: {
        bill: 'Short, stubby bill — about a third the length of the head.',
        tail: 'White outer tail feathers with black bars or spots.',
      },
    },
    {
      key: 'hairy',
      name: 'Hairy Woodpecker',
      latin: 'Leuconotopicus villosus',
      traits: {
        bill: 'Long, chisel-like bill — about as long as the head is deep.',
        tail: 'Clean, unmarked white outer tail feathers.',
      },
    },
  ],
  marks: [
    {
      key: 'bill',
      label: 'Bill length vs. head',
      diagnostic: true,
      note: 'The most reliable mark. Compare the bill to the depth of the head, not to the bird.',
    },
    {
      key: 'tail',
      label: 'Outer tail feathers',
      diagnostic: true,
      note: 'Reliable when visible: Downy has black bars on the white outer tail; Hairy’s are plain white.',
    },
    {
      key: 'size',
      label: 'Overall size',
      diagnostic: false,
      note: 'Hairy is bigger on average, but without another bird for scale size is very hard to judge — and a photo gives no scale at all.',
    },
    {
      key: 'red',
      label: 'Red patch on head',
      diagnostic: false,
      note: 'Both species have it: males of both show red on the back of the head; females of both lack it.',
    },
    {
      key: 'back',
      label: 'White stripe down the back',
      diagnostic: false,
      note: 'Both species share the same white back stripe and spotted wings.',
    },
    {
      key: 'gestalt',
      label: 'General impression',
      diagnostic: false,
      note: 'Overall impression is how experts start, but for this pair it misleads beginners. Check the bill to confirm.',
    },
  ],
}

export const FINCHES: Pair = {
  key: 'finches',
  title: 'House vs. Purple Finch',
  short: 'Finches',
  question: 'Which finch is this?',
  lede: 'Both males are red and both females are streaky brown. The question is never “is it red?” but “where is the red, and how clean are the flanks?”',
  rule:
    'Red only on the head, breast and rump, with a brown back and blurry brown streaks on the flanks → House. Raspberry washed over the head, back and wings, with clean pale flanks → Purple. For brown birds: a plain face is House; a bold white eyebrow and dark cheek patch is Purple.',
  traits: [
    { key: 'color', label: 'Where the red is (males)' },
    { key: 'flanks', label: 'Flanks & belly' },
    { key: 'face', label: 'Face (females)' },
    { key: 'bill', label: 'Bill' },
  ],
  species: [
    {
      key: 'house',
      name: 'House Finch',
      latin: 'Haemorhous mexicanus',
      primerPhoto: 'house-57363749',
      traits: {
        color: 'Red to orange on the forehead, eyebrow, throat, breast and rump. Back and wings stay brown.',
        flanks: 'Blurry brown streaks run down the flanks and belly.',
        face: 'Plain, evenly streaked face with no strong pattern.',
        bill: 'Stubby, with a curved upper edge.',
      },
    },
    {
      key: 'purple',
      name: 'Purple Finch',
      latin: 'Haemorhous purpureus',
      primerPhoto: 'purple-73218113',
      traits: {
        color: 'Raspberry wash over the whole head, back and wings — like the bird was dipped in wine.',
        flanks: 'Clean, pale flanks and belly; males have at most faint pinkish streaks.',
        face: 'Bold whitish eyebrow and a dark cheek patch.',
        bill: 'Straighter, more pointed cone.',
      },
    },
  ],
  marks: [
    {
      key: 'color',
      label: 'Where the red is',
      diagnostic: true,
      note: 'Reliable on males: House keeps a brown back; Purple’s raspberry spreads onto the back and wings.',
    },
    {
      key: 'flanks',
      label: 'Streaks on the flanks',
      diagnostic: true,
      note: 'Reliable for both sexes: House has blurry brown flank streaks; Purple’s flanks are clean (male) or crisply streaked on white (female).',
    },
    {
      key: 'face',
      label: 'Face pattern',
      diagnostic: true,
      note: 'The best mark on brown birds: a Purple female has a bold eyebrow and cheek patch; a House female’s face is plain.',
    },
    {
      key: 'shade',
      label: 'Shade of red',
      diagnostic: false,
      note: 'Shade depends on diet and light — House Finches can look purplish and Purple Finches orange. Look at where the color is, not which color.',
    },
    {
      key: 'size',
      label: 'Overall size',
      diagnostic: false,
      note: 'They are almost the same size, and a photo gives no scale.',
    },
    {
      key: 'gestalt',
      label: 'General impression',
      diagnostic: false,
      note: 'The classic beginner error is calling any red finch a Purple Finch. Check the back and flanks before you decide.',
    },
  ],
}

export const HAWKS: Pair = {
  key: 'hawks',
  title: 'Cooper’s vs. Sharp-shinned Hawk',
  short: 'Hawks',
  question: 'Which hawk is this?',
  lede: 'Same colors at every age, and a female Sharp-shinned is about the size of a male Cooper’s. Look at the shape of the head, tail and legs instead.',
  rule:
    'A big blocky head, rounded tail tip with a broad white band, and thick legs → Cooper’s. A small round head, square tail tip with a thin white band, and pencil-thin legs → Sharp-shinned. Expect to feel unsure — experienced birders leave some of these unidentified.',
  traits: [
    { key: 'head', label: 'Head' },
    { key: 'tail', label: 'Tail tip' },
    { key: 'legs', label: 'Legs' },
  ],
  species: [
    {
      key: 'coopers',
      name: 'Cooper’s Hawk',
      latin: 'Astur cooperii',
      primerPhoto: 'coopers-191414186',
      traits: {
        head: 'Large, blocky head. Adults have a dark cap that contrasts with a paler nape.',
        tail: 'Rounded tip, with a broad white band at the end.',
        legs: 'Thick, sturdy legs.',
      },
    },
    {
      key: 'sharpie',
      name: 'Sharp-shinned Hawk',
      latin: 'Accipiter striatus',
      primerPhoto: 'sharpie-254386996',
      traits: {
        head: 'Small, round head. The dark crown blends into the back like a hood.',
        tail: 'Square or notched tip, with a thin white band.',
        legs: 'Pencil-thin legs — the “sharp shins”.',
      },
    },
  ],
  marks: [
    {
      key: 'tail',
      label: 'Tail tip shape',
      diagnostic: true,
      note: 'One of the best marks when the tail is folded: rounded with a broad white tip is Cooper’s; square with a thin tip is Sharp-shinned.',
    },
    {
      key: 'head',
      label: 'Head size & cap',
      diagnostic: true,
      note: 'Cooper’s looks big-headed and “capped”; Sharp-shinned looks small-headed and “hooded”.',
    },
    {
      key: 'legs',
      label: 'Leg thickness',
      diagnostic: true,
      note: 'Sharp-shinned legs are strikingly thin. Helpful when the legs are visible and in focus.',
    },
    {
      key: 'size',
      label: 'Overall size',
      diagnostic: false,
      note: 'Females are bigger than males in both species, so a female Sharp-shinned overlaps a male Cooper’s. Size alone misleads.',
    },
    {
      key: 'plumage',
      label: 'Breast color & streaks',
      diagnostic: false,
      note: 'Adults of both have orange barring; young birds of both are brown with streaks. Plumage tells you age, not species.',
    },
    {
      key: 'eye',
      label: 'Eye color',
      diagnostic: false,
      note: 'Eyes go from yellow to orange to red with age in both species.',
    },
    {
      key: 'gestalt',
      label: 'General impression',
      diagnostic: false,
      note: 'Most backyard reports are called Cooper’s by default. Check the tail tip and head first.',
    },
  ],
}

export const PAIRS: Pair[] = [WOODPECKERS, FINCHES, HAWKS]

export function speciesOf(key: SpeciesKey): Species {
  for (const pair of PAIRS) {
    const s = pair.species.find((sp) => sp.key === key)
    if (s) return s
  }
  throw new Error(`unknown species ${key}`)
}

export function pairOf(key: SpeciesKey): Pair {
  const pair = PAIRS.find((p) => p.species.some((s) => s.key === key))
  if (!pair) throw new Error(`unknown species ${key}`)
  return pair
}

export const ALL_PHOTOS = rawPhotos as Photo[]
export const PHOTOS = ALL_PHOTOS.filter((p) => !p.exclude)

// Hold back the last photos of each species for the pre-/post-tests (next milestone),
// so practice never shows a test photo.
const TEST_PER_SPECIES = 6
export const PRACTICE_PHOTOS: Photo[] = []
export const TEST_PHOTOS: Photo[] = []
for (const pair of PAIRS) {
  for (const { key } of pair.species) {
    const ofSpecies = PHOTOS.filter((p) => p.species === key)
    PRACTICE_PHOTOS.push(...ofSpecies.slice(0, ofSpecies.length - TEST_PER_SPECIES))
    TEST_PHOTOS.push(...ofSpecies.slice(ofSpecies.length - TEST_PER_SPECIES))
  }
}
