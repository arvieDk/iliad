# Developers page content

Everything on the **/developers** page comes from this folder. You only need to
edit `developers.json` and drop photos in here. No code changes are needed.

## Add or change a developer

1. Put the photo in this folder, for example `maria.jpg`.
   JPG, PNG or WebP all work. A portrait (taller than wide, about 4:5) looks best;
   it is cropped to fill the card.
2. Open `developers.json` and edit the entry:

   ```json
   { "name": "Maria Santos", "photo": "maria.jpg" }
   ```

   - `name`: shown under the photo.
   - `photo`: the file name in this folder, spelled exactly the same, including
     upper/lower case. If the file is missing, the card shows the person's initials.

3. Add more people by copying a line, or remove the lines you don't need.
   The cards keep the order of the list, and the number on each card follows it.
   Each card stands between two pillars of the temple; the rows rearrange
   themselves to fit the screen, so any number of people works.
   Keep a comma between entries, but not after the last one.

You can also change `eyebrow` (the small label), `title` and `intro` at the top.

## Check your edit

`developers.json` must stay valid JSON. If the page shows "The team could not be
loaded", paste the file into a JSON checker (search "JSON validator") to find the
missing comma or quote.
