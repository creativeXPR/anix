// Fan badges for football rooms (2026-10-13). A fixed catalogue in code,
// plus whatever the admin adds from /admin (Firestore `badges/{id}`, same
// shape) — merged by id, Firestore wins. Club colours + emoji flags only:
// no official crests (trademarks).
//
// Shape: { id, name, group, colors: [main, second], emoji? }

const CLUBS = {
  'Premier League': [
    ['arsenal', 'Arsenal', '#EF0107', '#FFFFFF'],
    ['aston-villa', 'Aston Villa', '#95BFE5', '#670E36'],
    ['bournemouth', 'Bournemouth', '#DA291C', '#000000'],
    ['brentford', 'Brentford', '#E30613', '#FFFFFF'],
    ['brighton', 'Brighton', '#0057B8', '#FFFFFF'],
    ['burnley', 'Burnley', '#6C1D45', '#99D6EA'],
    ['chelsea', 'Chelsea', '#034694', '#FFFFFF'],
    ['crystal-palace', 'Crystal Palace', '#1B458F', '#C4122E'],
    ['everton', 'Everton', '#003399', '#FFFFFF'],
    ['fulham', 'Fulham', '#000000', '#FFFFFF'],
    ['leeds', 'Leeds United', '#1D428A', '#FFCD00'],
    ['liverpool', 'Liverpool', '#C8102E', '#00B2A9'],
    ['man-city', 'Man City', '#6CABDD', '#1C2C5B'],
    ['man-united', 'Man United', '#DA291C', '#FBE122'],
    ['newcastle', 'Newcastle', '#241F20', '#FFFFFF'],
    ['nottingham-forest', 'Nottingham Forest', '#DD0000', '#FFFFFF'],
    ['sunderland', 'Sunderland', '#EB172B', '#FFFFFF'],
    ['tottenham', 'Tottenham', '#132257', '#FFFFFF'],
    ['west-ham', 'West Ham', '#7A263A', '#1BB1E7'],
    ['wolves', 'Wolves', '#FDB913', '#231F20'],
  ],
  'La Liga': [
    ['real-madrid', 'Real Madrid', '#FEBE10', '#00529F'],
    ['barcelona', 'Barcelona', '#A50044', '#004D98'],
    ['atletico-madrid', 'Atlético Madrid', '#CB3524', '#272E61'],
    ['athletic-club', 'Athletic Club', '#EE2523', '#FFFFFF'],
    ['real-sociedad', 'Real Sociedad', '#0067B1', '#FFFFFF'],
    ['real-betis', 'Real Betis', '#00954C', '#FFFFFF'],
    ['villarreal', 'Villarreal', '#FFE667', '#005187'],
    ['sevilla', 'Sevilla', '#D71920', '#FFFFFF'],
    ['valencia', 'Valencia', '#EE3524', '#000000'],
  ],
  'Serie A': [
    ['inter', 'Inter', '#0068A8', '#000000'],
    ['ac-milan', 'AC Milan', '#FB090B', '#000000'],
    ['juventus', 'Juventus', '#000000', '#FFFFFF'],
    ['napoli', 'Napoli', '#12A0D7', '#FFFFFF'],
    ['roma', 'Roma', '#8E1F2F', '#F0BC42'],
    ['lazio', 'Lazio', '#87D8F7', '#FFFFFF'],
    ['atalanta', 'Atalanta', '#1E71B8', '#000000'],
  ],
  Bundesliga: [
    ['bayern', 'Bayern Munich', '#DC052D', '#0066B2'],
    ['dortmund', 'Dortmund', '#FDE100', '#000000'],
    ['leverkusen', 'Leverkusen', '#E32221', '#000000'],
    ['leipzig', 'RB Leipzig', '#DD0741', '#FFFFFF'],
  ],
  'Ligue 1': [
    ['psg', 'PSG', '#004170', '#DA291C'],
    ['marseille', 'Marseille', '#2FAEE0', '#FFFFFF'],
    ['lyon', 'Lyon', '#DA0812', '#14387F'],
    ['monaco', 'Monaco', '#E7212A', '#FFFFFF'],
  ],
  NPFL: [
    ['enyimba', 'Enyimba', '#0055A4', '#FFFFFF'],
    ['enugu-rangers', 'Rangers International', '#D21034', '#FFFFFF'],
    ['kano-pillars', 'Kano Pillars', '#FDB913', '#00843D'],
    ['rivers-united', 'Rivers United', '#0033A0', '#FFD100'],
    ['remo-stars', 'Remo Stars', '#00843D', '#FFFFFF'],
    ['shooting-stars', 'Shooting Stars', '#0055A4', '#FFFFFF'],
    ['plateau-united', 'Plateau United', '#00843D', '#FFD100'],
    ['kwara-united', 'Kwara United', '#00843D', '#FFFFFF'],
    ['akwa-united', 'Akwa United', '#FFD100', '#0055A4'],
    ['lobi-stars', 'Lobi Stars', '#E30613', '#FFFFFF'],
    ['heartland', 'Heartland', '#E30613', '#FFFFFF'],
    ['bendel-insurance', 'Bendel Insurance', '#0055A4', '#FFFFFF'],
    ['abia-warriors', 'Abia Warriors', '#00843D', '#FFD100'],
    ['ikorodu-city', 'Ikorodu City', '#6A1B9A', '#FFFFFF'],
  ],
  Elsewhere: [
    ['ajax', 'Ajax', '#D2122E', '#FFFFFF'],
    ['psv', 'PSV', '#ED1C24', '#FFFFFF'],
    ['benfica', 'Benfica', '#E83030', '#FFFFFF'],
    ['porto', 'Porto', '#00428C', '#FFFFFF'],
    ['sporting', 'Sporting CP', '#008057', '#FFFFFF'],
    ['celtic', 'Celtic', '#018749', '#FFFFFF'],
    ['galatasaray', 'Galatasaray', '#A90432', '#FDB912'],
    ['al-nassr', 'Al Nassr', '#FFE600', '#1B3C8C'],
    ['al-hilal', 'Al Hilal', '#0D4A9B', '#FFFFFF'],
    ['inter-miami', 'Inter Miami', '#F7B5CD', '#231F20'],
  ],
}

const COUNTRIES = [
  ['nigeria', 'Nigeria', '🇳🇬', '#008751', '#FFFFFF'],
  ['ghana', 'Ghana', '🇬🇭', '#CE1126', '#FCD116'],
  ['senegal', 'Senegal', '🇸🇳', '#00853F', '#FDEF42'],
  ['morocco', 'Morocco', '🇲🇦', '#C1272D', '#006233'],
  ['egypt', 'Egypt', '🇪🇬', '#CE1126', '#000000'],
  ['cameroon', 'Cameroon', '🇨🇲', '#007A5E', '#CE1126'],
  ['ivory-coast', "Côte d'Ivoire", '🇨🇮', '#F77F00', '#009E60'],
  ['algeria', 'Algeria', '🇩🇿', '#006233', '#D21034'],
  ['south-africa', 'South Africa', '🇿🇦', '#007749', '#FFB81C'],
  ['england', 'England', '🏴', '#CE1124', '#FFFFFF'],
  ['france', 'France', '🇫🇷', '#0055A4', '#EF4135'],
  ['spain', 'Spain', '🇪🇸', '#AA151B', '#F1BF00'],
  ['germany', 'Germany', '🇩🇪', '#000000', '#DD0000'],
  ['portugal', 'Portugal', '🇵🇹', '#006600', '#FF0000'],
  ['italy', 'Italy', '🇮🇹', '#009246', '#CE2B37'],
  ['netherlands', 'Netherlands', '🇳🇱', '#F36C21', '#21468B'],
  ['belgium', 'Belgium', '🇧🇪', '#ED2939', '#FAE042'],
  ['croatia', 'Croatia', '🇭🇷', '#FF0000', '#171796'],
  ['brazil', 'Brazil', '🇧🇷', '#009C3B', '#FFDF00'],
  ['argentina', 'Argentina', '🇦🇷', '#74ACDF', '#FFFFFF'],
  ['uruguay', 'Uruguay', '🇺🇾', '#0038A8', '#FCD116'],
  ['colombia', 'Colombia', '🇨🇴', '#FCD116', '#003893'],
  ['usa', 'USA', '🇺🇸', '#3C3B6E', '#B22234'],
  ['mexico', 'Mexico', '🇲🇽', '#006847', '#CE1126'],
  ['japan', 'Japan', '🇯🇵', '#BC002D', '#FFFFFF'],
]

export const BADGE_GROUPS = ['Countries', ...Object.keys(CLUBS)]

export const DEFAULT_BADGES = [
  ...COUNTRIES.map(([id, name, emoji, a, b]) => ({ id, name, group: 'Countries', emoji, colors: [a, b] })),
  ...Object.entries(CLUBS).flatMap(([group, list]) => list.map(([id, name, a, b]) => ({ id, name, group, colors: [a, b] }))),
]

function luminance(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16)
  if (Number.isNaN(n)) return 0.5
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// The colour a fan's name shows in: the club's main colour, unless it's
// near-white/near-black (Real Madrid, Juventus…) — then the other one.
// CSS still blends it toward the text colour for contrast in both themes.
export function badgeNameColor(badge) {
  if (!badge?.colors?.length) return null
  const [a, b = a] = badge.colors
  const la = luminance(a)
  return la > 0.8 || la < 0.02 ? b : a
}

// What travels on each message — a snapshot, so a later catalogue edit
// (or deletion) never changes past messages.
export function badgeSnapshot(badge) {
  if (!badge) return null
  return { id: badge.id, name: badge.name, colors: badge.colors.slice(0, 2), emoji: badge.emoji || null }
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
