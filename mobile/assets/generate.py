#!/usr/bin/env python3
"""Generuje ikony i ekrany startowe aplikacji mobilnej z plików PNG w tym katalogu.

    python3 mobile/assets/generate.py        (wymaga biblioteki Pillow)

Źródła (PNG wyrenderowane z plików SVG o tych samych nazwach):
  icon-only.png        1024×1024, bez przezroczystości — ikona iOS i ikony „legacy” Androida
  icon-foreground.png  1024×1024, przezroczyste tło   — pierwszy plan ikony adaptacyjnej Androida
  splash.png, splash-dark.png  2732×2732             — ekran startowy (jasny i ciemny)
  feature-graphic.png  1024×500                      — grafika główna wizytówki w Google Play

Pliki PNG powstają z SVG poleceniem: node mobile/assets/render.mjs

Wynik trafia do mobile/ios/App/App/Assets.xcassets, mobile/android/app/src/main/res
oraz (ikona 512 px i grafika główna Google Play) do mobile/fastlane/metadata/android/<język>/images.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent
ROOT = ASSETS.parents[1]
IOS = ROOT / 'mobile/ios/App/App/Assets.xcassets'
RES = ROOT / 'mobile/android/app/src/main/res'
PLAY = ROOT / 'mobile/fastlane/metadata/android'
LANCZOS = Image.Resampling.LANCZOS

icon = Image.open(ASSETS / 'icon-only.png').convert('RGB')
foreground = Image.open(ASSETS / 'icon-foreground.png').convert('RGBA')
splash = {
    'light': Image.open(ASSETS / 'splash.png').convert('RGB'),
    'dark': Image.open(ASSETS / 'splash-dark.png').convert('RGB'),
}
BACKGROUND = {'light': '#F8FAFC', 'dark': '#020617'}


def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


# ---------- iOS ----------
save(icon, IOS / 'AppIcon.appiconset/AppIcon-512@2x.png')
images = []
for suffix, scale in (('-2', '1x'), ('-1', '2x'), ('', '3x')):
    light = f'splash-2732x2732{suffix}.png'
    dark = f'splash-dark-2732x2732{suffix}.png'
    save(splash['light'], IOS / 'Splash.imageset' / light)
    save(splash['dark'], IOS / 'Splash.imageset' / dark)
    images.append({'idiom': 'universal', 'filename': light, 'scale': scale})
    images.append({
        'idiom': 'universal', 'filename': dark, 'scale': scale,
        'appearances': [{'appearance': 'luminosity', 'value': 'dark'}],
    })
(IOS / 'Splash.imageset/Contents.json').write_text(
    json.dumps({'images': images, 'info': {'version': 1, 'author': 'xcode'}}, indent=2) + '\n')


# ---------- Android: ikony ----------
def masked(image, size, radius):
    """Ikona „legacy”: zaokrąglony kwadrat (radius < size/2) albo koło (radius = size/2)."""
    scaled = image.resize((size * 4, size * 4), LANCZOS).convert('RGBA')
    mask = Image.new('L', scaled.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size * 4 - 1, size * 4 - 1), radius=radius * 4, fill=255)
    scaled.putalpha(mask)
    return scaled.resize((size, size), LANCZOS)


for density, size in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    folder = RES / f'mipmap-{density}'
    save(masked(icon, size, round(size * 0.22)), folder / 'ic_launcher.png')
    save(masked(icon, size, size // 2), folder / 'ic_launcher_round.png')
    adaptive = size * 108 // 48
    save(foreground.resize((adaptive, adaptive), LANCZOS), folder / 'ic_launcher_foreground.png')

# Tło ikony adaptacyjnej: ten sam gradient co w ikonie iOS.
(RES / 'drawable/ic_launcher_background.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient android:angle="315" android:startColor="#14532D" android:endColor="#0A2E18" />
</shape>
''')
for name in ('ic_launcher', 'ic_launcher_round'):
    (RES / f'mipmap-anydpi-v26/{name}.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
''')
(RES / 'values/ic_launcher_background.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0F4024</color>
</resources>
''')
# Wektorowy pierwszy plan z szablonu Capacitora nie jest używany (ikona korzysta z plików mipmap).
(RES / 'drawable-v24/ic_launcher_foreground.xml').unlink(missing_ok=True)


# ---------- Android: ekran startowy ----------
def compose(width, height, mode='light'):
    """Kafel z ikoną (środek pliku splash) na jednolitym tle, dla dowolnych proporcji ekranu."""
    canvas = Image.new('RGB', (width, height), BACKGROUND[mode])
    tile = splash[mode].crop((966, 966, 1766, 1766))
    side = int(min(width, height) * 0.5)
    tile = tile.resize((side, side), LANCZOS)
    canvas.paste(tile, ((width - side) // 2, (height - side) // 2))
    return canvas


PORTRAIT = {'mdpi': (320, 480), 'hdpi': (480, 800), 'xhdpi': (720, 1280), 'xxhdpi': (960, 1600), 'xxxhdpi': (1280, 1920)}
save(compose(480, 320), RES / 'drawable/splash.png')
for density, (w, h) in PORTRAIT.items():
    save(compose(w, h), RES / f'drawable-port-{density}/splash.png')
    save(compose(h, w), RES / f'drawable-land-{density}/splash.png')

# Android 12+: systemowy ekran startowy pokazuje ikonę aplikacji na tym tle.
# window_background: kolor nagłówka i dolnego paska aplikacji. Widać go za paskiem stanu i paskiem
# gestów na urządzeniach ze starszym WebView (poniżej 140), gdzie treść nie wchodzi pod paski systemu.
(RES / 'values/colors.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#F8FAFC</color>
    <color name="window_background">#FFFFFF</color>
</resources>
''')
(RES / 'values-night').mkdir(exist_ok=True)
(RES / 'values-night/colors.xml').write_text('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#020617</color>
    <color name="window_background">#0F172A</color>
</resources>
''')
print('✓ ikony i ekrany startowe: iOS + Android')


# ---------- Google Play: ikona 512 px i grafika główna ----------
feature = Image.open(ASSETS / 'feature-graphic.png').convert('RGB')
assert feature.size == (1024, 500), feature.size
for locale in ('pl-PL', 'en-US'):
    save(icon.resize((512, 512), LANCZOS), PLAY / locale / 'images/icon.png')
    save(feature, PLAY / locale / 'images/featureGraphic.png')

print('✓ wizytówka Google Play: ikona 512 px i grafika główna')
