/* ===== KATTA BINOLAR (daraxtlardan oldin) ===== */
const rw = rng(2024);
/* ---- katta binolar (halqa yo'ldan tashqarida) ---- */
(function bigBuildings() {
  const SIGNS = ['STATION', 'BANK', 'SCHOOL', 'CINEMA', 'HOSPITAL', 'MUSEUM', 'MALL', 'GYM', 'OFFICE', 'THEATRE', 'HOTEL', 'POST', 'PARK CAFE', 'SHOP'];
  const COL = [0xc9d3df, 0xd8c7b0, 0xb7c8b5, 0xd9b8b0, 0xa9b9d4, 0xe3d6b0, 0xbfb2d1, 0xaed0cf, 0xe0c0a0];
  const ROOF = [0x5b6270, 0x6a4a3a, 0x445a7a, 0x4a5d4a, 0x6b4a8a];
  let n = 0, tries = 0, si = 0;
  while (n < 34 && tries < 1500) {
    tries++;
    const x = (rw() - 0.5) * 196, z = (rw() - 0.5) * 196;
    const tall = rw() < 0.7;
    const w = 10 + rw() * 5, d = 9 + rw() * 4, h = tall ? 14 + rw() * 22 : 7 + rw() * 5;
    const x2 = Math.abs(x) > Math.abs(z);
    const face = x2 ? (x > 0 ? 'nx' : 'px') : (z > 0 ? 'nz' : 'pz');
    const sw = face === 'pz' || face === 'nz', hx = (sw ? w : d) / 2, hz = (sw ? d : w) / 2;
    if (!(Math.abs(x) - hx > 59 || Math.abs(z) - hz > 59)) continue;      // halqa yo'ldan tashqarida
    if (Math.abs(x) + hx > 97 || Math.abs(z) + hz > 97) continue;
    if (Math.abs(x) - hx < 10 || Math.abs(z) - hz < 10) continue;         // asosiy ko'chalardan uzoq
    if (boxes.some(b => x + hx + 3 > b.x0 && x - hx - 3 < b.x1 && z + hz + 3 > b.z0 && z - hz - 3 < b.z1)) continue;
    addBuilding({ x, z, w, d, h, color: COL[Math.floor(rw() * COL.length)], roof: ROOF[Math.floor(rw() * ROOF.length)], face,
      sign: rw() < 0.75 ? SIGNS[si++ % SIGNS.length] : null, awning: [0xc8452f, 0x2f6fb0, 0x3f9a62, 0xf2b035][Math.floor(rw() * 4)], flat: h > 10, rh: 2 });
    n++;
  }
})();

