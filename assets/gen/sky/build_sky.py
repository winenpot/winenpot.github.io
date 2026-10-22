"""Build src/data/sky.json for Sky.astro: the real night sky as data.

What it writes:
  stars  - every star to magnitude 5.0, plus any fainter star a constellation
           figure needs, as flat [ra*100, dec*100, mag*10, bv*100] ints (J2000).
  cons   - the 88 standard (IAU / d3-celestial) stick figures: polylines of
           indices into `stars`, Latin + Persian name, label position.
  snaps  - SNAPSHOTS random moments, half standing on Sahara dunes looking up
           at Mars, half on Martian dune fields / landing sites looking up at
           Earth. Each carries a 3x3 matrix (rows: north, east, up, in J2000
           equatorial coordinates), so the page only needs one matrix-vector
           product per star: no astronomy library ships to the browser.

Accuracy is deliberately "soft but real": star and planet directions are
correct to well under a pixel; places are rounded to ~0.1 deg; Mars uses the
IAU 2000 rotation model and ignores light-time.

Run (from the repo root; pure-Python dep, no venv needed):
  uv run --no-project --with astronomy-engine python assets/gen/sky/build_sky.py

Data: d3-celestial by Olaf Frohn (BSD-3, see d3-celestial/LICENSE), stars from
Hipparcos via XHIP. Planet positions: astronomy-engine (MIT, Don Cross).
"""
import json
import math
import pathlib
import random

import astronomy as A

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SRC = HERE / 'd3-celestial'
OUT = ROOT / 'src' / 'data' / 'sky.json'

MAG_LIMIT = 5.0
SNAPSHOTS = 120          # "ten dozen"
SEED = 1406
YEARS = (2026, 2036)     # snapshot dates are drawn from this range
PLANET_ALT = (16, 45)    # low enough to stay on the painted beam, clear of the horizon haze

# (place, region, lat, lon east) - approximate centres, ~0.1 deg
SAHARA = [
    ('Erg Chebbi', 'Morocco', 31.15, -3.98),
    ('Erg Chigaga', 'Morocco', 29.85, -6.25),
    ('the Grand Erg Occidental', 'Algeria', 30.5, 0.5),
    ("Tassili n'Ajjer", 'Algeria', 25.5, 9.0),
    ('Assekrem, in the Hoggar', 'Algeria', 23.27, 5.63),
    ('Erg Chech', 'Algeria', 24.5, -2.5),
    ('the Ténéré', 'Niger', 18.0, 10.0),
    ('the Aïr Mountains', 'Niger', 18.3, 8.0),
    ('Emi Koussi, in the Tibesti', 'Chad', 19.79, 18.55),
    ('the Ennedi Plateau', 'Chad', 17.0, 22.0),
    ('the Ubari Sand Sea', 'Libya', 26.7, 12.8),
    ('the Great Sand Sea', 'Egypt', 27.5, 25.0),
    ('Siwa Oasis', 'Egypt', 29.2, 25.52),
    ('the White Desert', 'Egypt', 27.36, 28.16),
    ('the Gilf Kebir', 'Egypt', 23.4, 25.9),
    ('the Richat Structure', 'Mauritania', 21.12, -11.40),
    ('Chinguetti', 'Mauritania', 20.46, -12.36),
]

# (place, note, planetocentric lat, east lon)
MARS = [
    ('the Bagnold Dunes, Gale crater', 'Curiosity drove through them', -4.7, 137.4),
    ('Jezero crater', 'where Perseverance landed', 18.44, 77.45),
    ('Utopia Planitia', 'where Zhurong landed', 25.07, 109.93),
    ('Meridiani Planum', 'where Opportunity landed', -1.95, 354.47),
    ('Gusev crater', 'where Spirit landed', -14.57, 175.47),
    ('Chryse Planitia', 'where Viking 1 landed', 22.27, 312.05),
    ('Elysium Planitia', 'where InSight landed', 4.50, 135.62),
    ('Ares Vallis', 'where Pathfinder landed', 19.13, 326.78),
    ('Olympia Undae', 'the great northern dune sea', 81.0, 180.0),
]

D = math.pi / 180


def unit(ra_deg, dec_deg):
    ra, dec = ra_deg * D, dec_deg * D
    return (math.cos(dec) * math.cos(ra), math.cos(dec) * math.sin(ra), math.sin(dec))


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def norm(a):
    n = math.sqrt(dot(a, a))
    return (a[0] / n, a[1] / n, a[2] / n)


def altaz(rows, v):
    n, e, u = (dot(r, v) for r in rows)
    return math.asin(max(-1, min(1, u))) / D, (math.atan2(e, n) / D) % 360


def radec(v):
    v = norm(v)
    return (math.atan2(v[1], v[0]) / D) % 360, math.asin(v[2]) / D


# ── catalogue ─────────────────────────────────────────────────────────────

def load_catalogue():
    feats = json.loads((SRC / 'stars.6.json').read_text('utf-8'))['features']
    raw = []
    for f in feats:
        lon, lat = f['geometry']['coordinates']
        try:
            bv = float(f['properties'].get('bv') or 0.6)
        except ValueError:
            bv = 0.6
        raw.append((lon % 360, lat, float(f['properties']['mag']), bv))

    lines = json.loads((SRC / 'constellations.lines.json').read_text('utf-8'))['features']
    names = {f['id']: f for f in json.loads((SRC / 'constellations.json').read_text('utf-8'))['features']}

    # every star a figure touches stays, however faint
    keep = {i for i, s in enumerate(raw) if s[2] <= MAG_LIMIT}
    vecs = [unit(s[0], s[1]) for s in raw]
    vertex_star = {}
    extra = []
    for f in lines:
        for poly in f['geometry']['coordinates']:
            for lon, lat in poly:
                key = (round(lon % 360, 4), round(lat, 4))
                if key in vertex_star:
                    continue
                v = unit(lon % 360, lat)
                best, bd = None, math.cos(0.08 * D)
                for i, w in enumerate(vecs):
                    d = dot(v, w)
                    if d > bd:
                        best, bd = i, d
                if best is None:   # figure vertex with no catalogue star: keep it as a faint point
                    extra.append((lon % 360, lat, 5.5, 0.6))
                    vertex_star[key] = ('x', len(extra) - 1)
                else:
                    keep.add(best)
                    vertex_star[key] = ('s', best)

    order = sorted(keep, key=lambda i: raw[i][2]) + [('x', j) for j in range(len(extra))]
    index = {}
    stars = []
    for k in order:
        s = raw[k] if not isinstance(k, tuple) else extra[k[1]]
        index[k] = len(stars) // 4          # stars is flat: 4 numbers per star
        stars.extend([round(s[0] * 100), round(s[1] * 100), round(s[2] * 10), round(s[3] * 100)])

    def idx(lon, lat):
        kind, i = vertex_star[(round(lon % 360, 4), round(lat, 4))]
        return index[i] if kind == 's' else index[('x', i)]

    cons = []
    for f in lines:
        meta = names.get(f['id'], {}).get('properties', {})
        pos = names.get(f['id'], {}).get('geometry', {}).get('coordinates', [0, 0])
        cons.append({
            'id': f['id'],
            'name': meta.get('name', f['id']),
            'fa': meta.get('fa', ''),
            'rank': int(meta.get('rank', 3)),
            'label': [round(pos[0] % 360, 2), round(pos[1], 2)],
            'lines': [[idx(lon, lat) for lon, lat in poly] for poly in f['geometry']['coordinates']],
        })
    return stars, cons


# ── observer frames ───────────────────────────────────────────────────────

def earth_rows(time, obs):
    """J2000 equatorial -> (north, east, up), from astronomy-engine (precession + nutation + Earth rotation)."""
    rot = A.Rotation_EQJ_HOR(time, obs)            # HOR: x = north, y = west, z = zenith
    cols = [A.RotateVector(rot, A.Vector(*e, time)) for e in ((1, 0, 0), (0, 1, 0), (0, 0, 1))]
    north = (cols[0].x, cols[1].x, cols[2].x)
    west = (cols[0].y, cols[1].y, cols[2].y)
    up = (cols[0].z, cols[1].z, cols[2].z)
    return north, (-west[0], -west[1], -west[2]), up


def mars_axes(time):
    """Mars body-fixed axes in J2000 equatorial coordinates (IAU 2000 rotation model)."""
    d = time.tt
    T = d / 36525
    a0, d0 = (317.68143 - 0.1061 * T) * D, (52.88650 - 0.0609 * T) * D
    W = ((176.630 + 350.89198226 * d) % 360) * D
    p = (math.cos(d0) * math.cos(a0), math.cos(d0) * math.sin(a0), math.sin(d0))
    node = (-math.sin(a0), math.cos(a0), 0.0)
    q = cross(p, node)
    xb = tuple(math.cos(W) * node[i] + math.sin(W) * q[i] for i in range(3))
    yb = cross(p, xb)
    return xb, yb, p


def mars_rows(time, lat, lon):
    xb, yb, p = mars_axes(time)
    la, lo = lat * D, lon * D
    up = tuple(math.cos(la) * math.cos(lo) * xb[i] + math.cos(la) * math.sin(lo) * yb[i] + math.sin(la) * p[i] for i in range(3))
    east = tuple(-math.sin(lo) * xb[i] + math.cos(lo) * yb[i] for i in range(3))
    return cross(up, east), east, up


def hhmm(hours):
    m = round((hours % 24) * 60) % 1440
    return f'{m // 60:02d}:{m % 60:02d}'


def random_time(rng):
    t0 = A.Time.Make(YEARS[0], 1, 1, 0, 0, 0).ut
    t1 = A.Time.Make(YEARS[1], 1, 1, 0, 0, 0).ut
    return A.Time(rng.uniform(t0, t1))


def iso(time):
    return str(time)[:16] + 'Z'   # 2031-05-12T21:40Z


def earth_snapshot(rng):
    while True:
        place, region, lat, lon = rng.choice(SAHARA)
        time = random_time(rng)
        obs = A.Observer(lat, lon, 400)
        rows = earth_rows(time, obs)
        sun = A.GeoVector(A.Body.Sun, time, True)
        if altaz(rows, norm((sun.x, sun.y, sun.z)))[0] > -15:
            continue
        eq = A.Equator(A.Body.Mars, time, obs, False, True)       # J2000, topocentric, aberration
        alt, az = altaz(rows, unit(eq.ra * 15, eq.dec))
        if not PLANET_ALT[0] <= alt <= PLANET_ALT[1]:
            continue
        solar = (A.HourAngle(A.Body.Sun, time, obs) + 12) % 24
        return {
            'world': 'earth', 'place': place, 'where': region, 'lat': lat, 'lon': lon,
            'utc': iso(time), 'date': str(A.Time(time.ut + lon / 360))[:10], 'local': hhmm(solar),
            'm': [round(x, 6) for r in rows for x in r],
            'planet': {'name': 'Mars', 'ra': round(eq.ra * 15, 3), 'dec': round(eq.dec, 3),
                       'mag': round(A.Illumination(A.Body.Mars, time).mag, 1)},
        }


def mars_snapshot(rng):
    while True:
        place, note, lat, lon = rng.choice(MARS)
        time = random_time(rng)
        rows = mars_rows(time, lat, lon)
        hm, he = A.HelioVector(A.Body.Mars, time), A.HelioVector(A.Body.Earth, time)
        to_sun = norm((-hm.x, -hm.y, -hm.z))
        if altaz(rows, to_sun)[0] > -12:
            continue
        to_earth = (he.x - hm.x, he.y - hm.y, he.z - hm.z)
        alt, az = altaz(rows, norm(to_earth))
        if not PLANET_ALT[0] <= alt <= PLANET_ALT[1]:
            continue
        # Earth's brightness from Mars: H = -3.99, ~0.0154 mag/deg phase law (rough, fine here)
        r = math.sqrt(he.x ** 2 + he.y ** 2 + he.z ** 2)
        delta = math.sqrt(dot(to_earth, to_earth))
        phase = math.acos(max(-1, min(1, dot(norm((-he.x, -he.y, -he.z)), norm((-to_earth[0], -to_earth[1], -to_earth[2])))))) / D
        mag = -3.99 + 5 * math.log10(r * delta) + 0.0154 * phase
        xb, yb, _ = mars_axes(time)
        sun_lon = math.atan2(dot(to_sun, yb), dot(to_sun, xb)) / D
        solar = 12 + ((lon - sun_lon + 180) % 360 - 180) / 15
        ra, dec = radec(to_earth)
        return {
            'world': 'mars', 'place': place, 'where': note, 'lat': lat, 'lon': lon,
            'utc': iso(time), 'date': str(time)[:10], 'local': hhmm(solar),   # Mars: Earth's (UTC) date
            'm': [round(x, 6) for r_ in rows for x in r_],
            'planet': {'name': 'Earth', 'ra': round(ra, 3), 'dec': round(dec, 3), 'mag': round(mag, 1)},
        }


def self_check():
    """The matrix path must agree with astronomy-engine's own Horizon() for Earth."""
    time, obs = A.Time.Make(2027, 2, 10, 19, 0, 0), A.Observer(25.5, 9.0, 0)
    rows = earth_rows(time, obs)
    for body in (A.Body.Mars, A.Body.Jupiter, A.Body.Saturn):
        j2000 = A.Equator(body, time, obs, False, True)
        ofdate = A.Equator(body, time, obs, True, True)
        ref = A.Horizon(time, obs, ofdate.ra, ofdate.dec, A.Refraction.Airless)
        alt, az = altaz(rows, unit(j2000.ra * 15, j2000.dec))
        err = max(abs(alt - ref.altitude), abs((az - ref.azimuth + 180) % 360 - 180))
        assert err < 0.01, (body, alt, az, ref.altitude, ref.azimuth)
    # on Mars, local noon must be (close to) the Sun's highest point
    time = A.Time.Make(2030, 3, 1, 0, 0, 0)
    xb, yb, _ = mars_axes(time)
    hm = A.HelioVector(A.Body.Mars, time)
    to_sun = norm((-hm.x, -hm.y, -hm.z))
    sun_lon = math.atan2(dot(to_sun, yb), dot(to_sun, xb)) / D
    alt_noon = altaz(mars_rows(time, 0.0, sun_lon), to_sun)[0]
    assert alt_noon > 60, alt_noon


def main():
    self_check()
    rng = random.Random(SEED)
    stars, cons = load_catalogue()
    n = len(stars) // 4
    longest = 0.0
    for con in cons:
        for line in con['lines']:
            for a, b in zip(line, line[1:]):
                assert a < n and b < n, (con['id'], a, b)
                va, vb = (unit(stars[i * 4] / 100, stars[i * 4 + 1] / 100) for i in (a, b))
                longest = max(longest, math.acos(max(-1, min(1, dot(va, vb)))) / D)
    assert longest < 35, f'a figure segment spans {longest:.1f} deg - index mix-up?'
    snaps = [earth_snapshot(rng) for _ in range(SNAPSHOTS // 2)] + [mars_snapshot(rng) for _ in range(SNAPSHOTS - SNAPSHOTS // 2)]
    rng.shuffle(snaps)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        'source': 'assets/gen/sky/build_sky.py - d3-celestial (BSD-3, Olaf Frohn), astronomy-engine (MIT)',
        'stars': stars, 'cons': cons, 'snaps': snaps,
    }, ensure_ascii=False, separators=(',', ':')), 'utf-8')
    print(f'{OUT.relative_to(ROOT)}: {n} stars, {len(cons)} figures (longest segment {longest:.1f} deg), {len(snaps)} snapshots, {OUT.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()
