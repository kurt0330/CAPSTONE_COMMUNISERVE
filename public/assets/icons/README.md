# UI icons

Every icon in the app is rendered by `<Icon name="…" />` (src/components/ui/Icon.jsx) from a file in this folder. The files here are simple line-art **placeholders** — replace them with Flaticon assets.

## Swapping in a Flaticon icon

1. Download the icon from Flaticon as **SVG** (preferred) or **PNG**.
2. Save it here with the **exact file name** from the table below, overwriting the placeholder.
3. If you saved a PNG instead of an SVG, change that entry's `file` in `src/lib/icons.js` (e.g. `search.png`).

**Colour.** Icons are drawn as a CSS mask, so they take the surrounding text colour (blue in active tabs, grey in lists, white on buttons). Pick **monochrome / line** icons — any colour works, only the shape is used. For a full-colour Flaticon icon, render it with `<Icon name="…" color />` to show the file as-is.

**Check for a background.** Only the shape (alpha) is used, so any colour is fine — but an SVG that includes a white or coloured **background rectangle** will render as a solid square. Pick icons with a transparent background, or delete the background <rect> from the file.

**Size.** `size` maps to CSS classes in src/styles/globals.css: `icon-xs` 12px, `icon-sm` 16px, `icon-md` 20px (default), `icon-lg` 24px, `icon-xl` 32px, `icon-2xl` 44px. Square icons with a little padding look best.

**Attribution.** Flaticon free icons require crediting the author (see the licence on each icon's download page). Keep a record of what you download.

## Icon list

| File | Name in code | Suggested Flaticon search | Used in |
|---|---|---|---|
| `arrow-left.svg` | `arrow-left` | left arrow | icons.js, page.js |
| `arrow-right.svg` | `arrow-right` | right arrow | RegisterForm.jsx, icons.js, page.js, page.js, page.js |
| `chevron-left.svg` | `chevron-left` | chevron left | AppTopBar.jsx, AssessmentsClient.jsx, Step4Assessment.jsx, icons.js, page.js |
| `chevron-right.svg` | `chevron-right` | chevron right | AssessmentsClient.jsx, ListCard.jsx, Step4Assessment.jsx, icons.js, page.js, page.js, page.js |
| `close.svg` | `close` | close | AssessmentsClient.jsx, ChipList.jsx, JobRequestCard.jsx, PendingTable.jsx, RegisterForm.jsx, SPDetailsModal.jsx, SearchBar.jsx, Step5Files.jsx, icons.js |
| `check.svg` | `check` | check mark | AssessmentsClient.jsx, JobRequestCard.jsx, PendingTable.jsx, PortfolioClient.jsx, RegisterForm.jsx, SPDetailsModal.jsx, Step3Trade.jsx, Step5Files.jsx, StepProgressBar.jsx, icons.js, page.js |
| `check-circle.svg` | `check-circle` | check circle | DashboardClient.jsx, ProviderProfileClient.jsx, RegisterForm.jsx, Step4Assessment.jsx, icons.js, page.js, page.js, page.js, page.js |
| `search.svg` | `search` | magnifying glass | ApprovedTable.jsx, CustomerRequestsClient.jsx, Icon.jsx, PendingTable.jsx, SearchBar.jsx, SearchClient.jsx, icons.js, layout.js, page.js, page.js, page.js |
| `share.svg` | `share` | share | AppTopBar.jsx, icons.js |
| `external-link.svg` | `external-link` | external link | SPDetailsModal.jsx, icons.js |
| `refresh.svg` | `refresh` | refresh | ApprovedTable.jsx, PendingTable.jsx, icons.js |
| `edit.svg` | `edit` | pencil edit | AssessmentsClient.jsx, PortfolioClient.jsx, icons.js |
| `eye.svg` | `eye` | eye view | PortfolioClient.jsx, RegisterForm.jsx, icons.js, page.js |
| `eye-off.svg` | `eye-off` | hide eye | RegisterForm.jsx, icons.js, page.js |
| `logout.svg` | `logout` | logout | AdminSidebar.jsx, LogoutButton.jsx, icons.js |
| `settings.svg` | `settings` | settings gear | AdminSidebar.jsx, icons.js |
| `warning.svg` | `warning` | warning | ApprovedTable.jsx, PendingTable.jsx, PortfolioClient.jsx, ProviderProfileClient.jsx, ProviderRequestsClient.jsx, RegisterForm.jsx, SPDetailsModal.jsx, Step4Assessment.jsx, ToastError.jsx, icons.js, page.js, page.js, page.js, page.js, page.js, page.js |
| `help.svg` | `help` | question mark | Step4Assessment.jsx, icons.js |
| `hourglass.svg` | `hourglass` | hourglass | DashboardClient.jsx, ProviderSearchResultCard.jsx, Step4Assessment.jsx, icons.js |
| `clock.svg` | `clock` | clock | PortfolioClient.jsx, ProviderProfileClient.jsx, icons.js |
| `shield-check.svg` | `shield-check` | verified shield | ProfileHeaderCard.jsx, ProviderSearchResultCard.jsx, icons.js, page.js, page.js, page.js |
| `star.svg` | `star` | star filled | ApprovedTable.jsx, Icon.jsx, PortfolioClient.jsx, ProviderProfileClient.jsx, StarRating.jsx, icons.js, layout.js, page.js |
| `dashboard.svg` | `dashboard` | dashboard | AdminSidebar.jsx, SearchClient.jsx, icons.js |
| `home.svg` | `home` | home | Step1Personal.jsx, icons.js, layout.js, layout.js, page.js |
| `user.svg` | `user` | user | RequestCard.jsx, SPDetailsModal.jsx, icons.js, page.js, page.js |
| `users.svg` | `users` | group users | AdminSidebar.jsx, adminActions.js, icons.js, jobActions.js, layout.js, layout.js, layout.js, page.js, page.js, page.js, page.js, registerProvider.js, route.js, route.js, route.js, route.js, route.js |
| `map-pin.svg` | `map-pin` | location pin | JobRequestCard.jsx, ProfileHeaderCard.jsx, ProviderProfileClient.jsx, ProviderSearchResultCard.jsx, RequestCard.jsx, icons.js, page.js, page.js |
| `calendar.svg` | `calendar` | calendar | JobRequestCard.jsx, RequestCard.jsx, icons.js |
| `message.svg` | `message` | chat bubble | PortfolioClient.jsx, ProviderProfileClient.jsx, icons.js |
| `mail.svg` | `mail` | email | RegisterForm.jsx, icons.js, page.js |
| `phone.svg` | `phone` | phone | icons.js, page.js |
| `inbox.svg` | `inbox` | inbox | CustomerRequestsClient.jsx, EmptyState.jsx, ProviderRequestsClient.jsx, icons.js, page.js, page.js |
| `clipboard.svg` | `clipboard` | clipboard list | AdminSidebar.jsx, Step1Personal.jsx, Step4Assessment.jsx, icons.js, layout.js, layout.js, page.js |
| `file.svg` | `file` | document | AssessmentsClient.jsx, GalleryGrid.jsx, SPDetailsModal.jsx, Step4Assessment.jsx, Step5Files.jsx, icons.js |
| `certificate.svg` | `certificate` | certificate | GalleryGrid.jsx, PortfolioClient.jsx, Step5Files.jsx, icons.js, page.js, page.js, registerProvider.js, route.js |
| `image.svg` | `image` | image gallery | GalleryGrid.jsx, icons.js |
| `camera.svg` | `camera` | camera | GalleryGrid.jsx, Step5Files.jsx, icons.js |
| `id-card.svg` | `id-card` | id card | ProviderProfileClient.jsx, icons.js |
| `briefcase.svg` | `briefcase` | briefcase | RequestCard.jsx, icons.js, layout.js, page.js |
| `toolbox.svg` | `toolbox` | toolbox | PortfolioClient.jsx, ProviderProfileClient.jsx, ProviderSearchResultCard.jsx, RequestCard.jsx, icons.js |
| `wrench.svg` | `wrench` | wrench | icons.js, page.js |
| `bolt.svg` | `bolt` | electrician lightning | Icon.jsx, Step3Trade.jsx, constants.js, icons.js |
| `hammer.svg` | `hammer` | carpenter hammer | Step3Trade.jsx, constants.js, icons.js |
| `broom.svg` | `broom` | housekeeping broom | Step3Trade.jsx, constants.js, icons.js |
| `hard-hat.svg` | `hard-hat` | worker helmet | icons.js, page.js |
| `accessibility.svg` | `accessibility` | disability | Step1Personal.jsx, icons.js |
| `senior.svg` | `senior` | elderly | Step1Personal.jsx, icons.js |
| `family.svg` | `family` | single parent | Step1Personal.jsx, icons.js |
