---
name: palette
description: Four colors from one, by the golden ratio. A main color in, an accent, a soft tint and a dark out, with the text color for each and the contrast between every pair measured. A proposal for the user to pick from. Invoke on "/palette <hex>", "build a palette", "what goes with this color", "i only have one color".
---

# palette

one color in, four out. every step uses one number, the golden ratio (1.618), so there is little to tune. it is a starting point the user picks from, never a decision made for them.

a brand that already names its colors wins. this is for when the user has one color and asks what goes with it. it does not replace `design`'s way of finding a look: with no brand, `design` still asks and shows real looks first, and these four colors are one thing to put in front of the user there.

## the method

work in hsb (hue, saturation, brightness), the model every color picker shows.

1. **main.** the one color you have. read its hue on the wheel. `#00B2A9` is hue 177, saturation 100, brightness 70.
2. **accent.** turn the hue back by the golden angle, 137.5 degrees. `360 / 1.618 = 222.5`, `360 - 222.5 = 137.5`, so `177 - 137.5 = 39.5`. under zero, add 360. keep the saturation.
3. **complementary.** the main hue again, the saturation cut by 61.8% (multiply it by 0.382), the brightness set to 81. a soft tint for large areas.
4. **contrast.** the main hue and saturation, the brightness multiplied by 0.382. `70 x 0.382 = 27`. a dark for type and for shapes that sit on the tint.

from `#00B2A9` that gives complementary `#80CFCB` and contrast `#004541`. the accent is hue 39.5: `#F29F00` once its brightness is lifted to 95, `#B37600` at the main color's 70. see below.

where the numbers come from: 1.618 is the ratio, 0.618 and 0.382 are the two parts it cuts a whole into, and 137.5 is the same cut made on a circle. 81 is given by the method with no rule behind it. 50 x 1.618 happens to land there.

## run it

```
node ~/.claude/skills/palette/palette.mjs '#00B2A9'
node ~/.claude/skills/palette/palette.mjs '#00B2A9' --accent-brightness 95
node ~/.claude/skills/palette/palette.mjs '#00B2A9' --css
node ~/.claude/skills/palette/palette.mjs '#00B2A9' --json
```

it prints the four colors with their hue, saturation and brightness, the text color to use on each, then the contrast ratio between every pair and whether that pair can carry text. `--css` prints four custom properties named after the four roles, `--json` the same data for a script. node only, no install.

text on each: the palette's own dark or tint if it reaches 4.5 on that color, else whichever of white and black measures higher.

values are rounded the way a picker shows them, hue to half a degree, saturation and brightness to a whole percent, so the output matches the method done by hand. the main color is never changed.

## what the method does not decide

- **how bright the accent is.** the method fixes its hue and nothing else. the script keeps the main color's brightness. the worked example above lifts the accent to 95 by eye, which is what `--accent-brightness 95` reproduces. pick it looking at the two colors side by side.
- **whether text is readable.** the golden ratio says nothing about that, so the script measures it. read the lines it prints: 4.5 or more carries text, 3 to 4.5 carries large text only, under 3 carries none. main and accent side by side are usually under 3: use them as shapes next to each other, never as text on each other.
- **a gray, a near black or a white main.** it has no hue to speak of, so the wheel has nothing to turn and the four colors come out as one. the script refuses a saturation under 5 or a brightness under 10 and says so. pick a color.
- **which contrast brightness.** the method multiplies the main color's brightness, not the tint's. a very dark main gives a contrast near black, which is fine for type and useless as a second surface.
- **the name.** complementary here means the soft partner of the main color. it is not the opposite side of the wheel.

## using the result

- it is a proposal. show the user the four swatches side by side on a real surface before any of it goes into a token file. they say yes, or they move one. in a brand file it goes in as proposed, not chosen, until they do.
- main and accent are two hues. `design` holds to one accent and gives a second hue a job or drops it. so the user picks which of the two is the accent, and the other gets a job (a surface, a data series, an illustration) or is left out.
- the four names are this method's, not a token vocabulary. mapped to the roles `design` uses: the complementary is a ground or a surface, the contrast is ink, one of main and accent is the accent, and the "text on each" line for it is its accent ink. rename them when they go into the project's tokens.
- once picked, the colors live where the project keeps them. the script is not run again on every build.
