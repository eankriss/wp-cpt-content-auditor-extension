# WP CPT Content Auditor

Full-page Chrome / Edge extension for auditing WordPress Custom Post Type entries through the public REST API.

## Features

- Enter a WordPress site URL.
- Discover REST-enabled post types/CPTs from `/wp-json/wp/v2/types`.
- Select the CPT to audit.
- Manual REST namespace/base fallback.
- Scan all public items with REST pagination.
- Classify each entry as:
  - Has Content
  - No Content
- Content modes:
  - Meaningful content: visible text or meaningful media
  - Visible text only
  - Any rendered markup
- Preview:
  - status
  - post ID
  - title
  - slug
  - word count
  - visible character count
  - modified date
  - clickable live preview URL
- Search/filter preview.
- Report choices:
  - Has Content only
  - No Content only
  - Both
- CSV export.
- XLSX export without third-party libraries.
- If Both + XLSX: separate `Has Content` and `No Content` sheets.
- If Both + CSV: two CSV files are downloaded because CSV cannot contain sheets/tabs.
- Light/dark mode.

## Install

1. Extract the ZIP.
2. Open `chrome://extensions/` or `edge://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the extracted `wp-cpt-content-auditor-extension` folder.

## Notes

The audit checks WordPress `content.rendered`. Content stored only in ACF/custom fields is not counted unless it is rendered into the main content field.

Only entries exposed through the site's public REST API can be scanned. Private/draft/authenticated-only entries normally cannot be accessed.
