# fairportmerchantsbowling.com

Website for the Fairport Merchants, a USBC handicap league bowling Thursday nights at AMF Fairview Lanes.

## How it works
- Built with Eleventy and published by Cloudflare Pages on every change to this repository.
  Cloudflare build settings: build command `npm run build`, output folder `_site`.
- **Posts** (news, stories, 300 Club photos, sidepots): one file each in `src/posts/`. Photos go in `src/images/uploads/`.
  Post from a browser with Pages CMS (app.pagescms.org, sign in with GitHub), or ask Claude to post it.
- **Stats** (standings, schedule, bowlers, teams, insights): `src/_data/league.json`, rebuilt each week from the
  recap workbook and the bowling centre's sheet, then replaced here. The stats pages read it from `/data/league.json`.
- **Rules / links / sponsors**: `src/_data/rules.json`, `links.json`, `sponsors.json` (an empty list hides the sponsor strip).
- **Feedback page**: set `feedback_form` in `src/_data/site.json` to a Google Form link to switch it on.
