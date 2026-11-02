# SubStore UI Pages — Design Handoff

This document describes the current UI surfaces in the Next.js app for a designer or another UI implementation. It is an implementation-oriented inventory, not a new visual design specification. Keep the existing shopping and admin flows unless a redesign explicitly changes them.

## Product and visual direction

- **Product:** SubStore ecommerce storefront and admin console.
- **Storefront shell:** Shared top navigation, page content, shared footer and toast notifications. The shell is omitted on `/admin` and `/admin/*`.
- **Typography:** Poppins is the main storefront font; Jost and Source Sans Pro are also loaded. The admin dashboard uses an Inter/system sans-serif stack. Font Awesome icons are used throughout.
- **Color cues:** Light surfaces are predominantly white with pale gray backgrounds and borders. Red (`#CC0000`) is the primary/accent color in the global theme. The admin login/dashboard has its own purple accent (around `#6c5ce7`) and supports light/dark themes.
- **Themes:** Global CSS includes light and dark theme tokens. Keep text, borders, cards, skeletons, and controls legible in both themes wherever the current page supports theme switching.
- **Responsive behavior:** The navigation collapses on smaller screens; product grids and forms adapt to narrow widths; cart and checkout columns become a single column around tablet/mobile breakpoints. The cart summary moves above cart items on narrow layouts. Preserve usable touch targets and avoid horizontal overflow.
- **Shared states:** Preserve loading/skeleton, empty, validation, error, success, modal/drawer, disabled, and image-fallback states; these are part of the interface, not optional polish.

## Shared storefront frame

### Header and navigation

The shared `Navbar` is present on all non-admin routes. It contains the store logo/brand, category navigation, search controls, and account/shopping actions (including cart and favorites). The category navigation includes grouped fashion collections and links into product browsing. Search can expand into an overlay/dialog with a search field, trending searches, top products/results, and a close action. On mobile, navigation is collapsed and search can open as its own overlay.

### Footer

The shared footer contains:

1. Newsletter signup with email input, submit/loading state, and success/error feedback (the text promotes a first-order discount).
2. Explore links (including Search and Blog).
3. About links (including Privacy Policy and Contact Us).
4. Contact information and social links.
5. Powered-by/copyright row and an Orders link.

### Global interaction and accessibility notes

- Product image failures use a shared unavailable-image fallback.
- Use visible focus styling for inputs, selects, text areas, and buttons.
- Keep modal/dialog close controls and icon-only controls accessible with labels.
- Preserve page-level toast feedback for actions such as cart/favorites updates.

## Storefront pages

| Route | Page purpose and visible UI | Key states and interactions |
|---|---|---|
| `/` | Home. Full-width rotating hero/banner carousel (five banner assets, auto-rotates about every five seconds), slide indicators and navigation; category card scroller; “Best selling” product section; women’s collection product section; FAQ accordion/list. | Carousel slide selection/rotation; category cards navigate to filtered collection pages; product cards navigate to details; FAQ expand/collapse; product loading/empty states. |
| `/products` | Main product discovery page. Heading and result count; desktop filter/refine area and mobile filter sheet; active-filter chips; product card grid. Filters include gender, category, subcategory, fit, size, colour, price and search where available. | Open/close mobile filters, apply/clear individual filters, search, loading skeleton, no-match state, product card actions. |
| `/category/[slug]` | Route adapter, not a separate visual page. Resolves category slug to gender/product category and redirects to `/products` with query parameters. | Direct route should land on the matching filtered listing. |
| `/kids` | Kids product listing using the shared product discovery UI, pre-filtered to kids. | Shared listing filters, skeleton, empty state, product card actions. |
| `/new-arrivals` | “New Arrivals” heading and grid of products marked as new. | Loading skeleton; empty state explains that products must be marked as new in admin; product card actions. |
| `/products/[id]` | Product detail. Product image gallery with selectable thumbnails/dots; product name, price/discount information and product purchase details; size/colour and quantity choices where supplied; add-to-cart/favorite actions; description/details; “You Might Also Like”/similar products; customer reviews, FAQ, and review submission. | Loading skeleton, unavailable/not-found state, image selection, validation for required options, cart feedback, review form, FAQ expansion. Match details to product data rather than assuming every item has every option. |
| `/product/[id]` | Alternate product-detail URL. Re-exports the `/products/[id]` page and styles; keep visual and behavior parity between both paths. | Same states and interactions as `/products/[id]`. |
| `/cart` | “My Bag” page with cart item rows/cards (image, product details, selected options, quantity and remove controls), coupon form, price/discount/tax/shipping summary, and checkout action. A wishlist/save action is also present where applicable. | Empty cart state, loading skeleton, quantity changes/removal, coupon validation/feedback, recalculated totals, checkout navigation. On mobile, show the summary before the item list and stack item content. |
| `/checkout` | Checkout form and order summary. Supports login-required state, contact/customer details, delivery address fields, saved-address use, payment-method selection, and order placement. UPI details may be requested for that method. | Login prompt, address selection/edit, form validation, payment-method-specific fields, loading/error/success states, final amount summary. Keep payment and address states explicit. |
| `/wishlist` | Saved/favorite products in a product-card layout, with product prices and actions to open or remove items. | Empty wishlist state; remove item; share/action controls where available. |
| `/login` | Customer sign-in panel with “Welcome Back”, email-or-phone and password inputs, password visibility toggle, submit/loading feedback, and password recovery/registration links. | Invalid credentials/validation feedback; password visibility; loading state; navigation to forgot-password/register. |
| `/register` | “Create Account” form with full name, optional email, phone number, password and password visibility control. | Required-field validation, submit/loading and error/success feedback; link to sign in. |
| `/forgot-password` | Password-recovery form with email or mobile number and submit action. | Validation, submit/loading, confirmation/error feedback. |
| `/reset-password` | Password reset from a tokenized link. Includes new-password and confirmation inputs. | Invalid/missing reset-link state; validation and mismatch feedback; submit/loading/success state. |
| `/profile` | Account profile view/edit page with account navigation, general information form and save action. Includes a change-password modal. | Loading/error/saved state; open/close password modal and submit password change. |
| `/profile/addresses` | Saved addresses page with account navigation, saved-address list, and add/edit address modal/form. Address fields include name, phone, house/building, locality, city, state and pincode. | Empty addresses, add/edit/delete/select flows as implemented, validation, modal close/save feedback. |
| `/orders` | “My Orders” page with order cards/list, purchase items, quantity/size, order status and access to order details/tracking. | Empty state (“No orders yet”), loading, order list, cancellation/return-related actions where applicable. |
| `/order/[orderId]` | Single order detail/tracking surface: order identifier, status/progress, delivery address, ordered items and order totals/details. | Loading/not-found/error; status changes represented in the timeline; return/cancel request states if applicable. |
| `/contact` | Contact Us page with contact form: name, email, subject and message; submit action and store contact context. | Required-field validation, sending/loading, success and error feedback. |
| `/privacy-policy` | Long-form privacy policy content page using readable heading/body hierarchy. This is a text-first legal page rather than a product grid. | Maintain readable line length, heading spacing and mobile typography. |
| `/blog` | Editorial fashion article page. Hero headline, editorial sections on modest wear, styling advice (layering/fabrics/accessories), clothing care, and a closing shop/CTA section. | Responsive editorial layout; preserve section hierarchy, image placement and CTA links. |

## Admin pages and in-page sections

### `/admin` — login state

Admin is a separate full-screen experience without the storefront navbar or footer. Before authentication, show a centered Admin Login panel with username/credential and password controls, a password visibility toggle, login feedback, and a light/dark theme toggle. Display a loading state while the client/admin interface initializes.

### `/admin` — dashboard shell

After authentication, show an operations console with:

- Sidebar navigation with active item styling, icons, optional count badge, collapse control, and permission-based visibility.
- Top header with administrator label, theme toggle and logout action.
- Main content area for the selected section.
- Overview cards for Total Orders, Total Products, Cancelled Orders and Total Revenue.
- Dashboard/analytics visualizations and summary data.

The admin uses a distinct neutral dashboard palette and denser data/table layouts than the storefront. Prefer clear card boundaries, compact but readable tables, filters/search, pagination where present, and confirmation/feedback for destructive or save actions.

### Admin navigation sections

These are sections inside `/admin`, not separate URL routes. Exact availability depends on role and permissions.

| Section | UI content to represent |
|---|---|
| Dashboard | Operations overview, KPI cards and summary content. |
| Analytics | Charts and analytics summaries. |
| Orders | Searchable/managed order list and order actions. |
| Ret/rep (requests) | Orders filtered to return/replace requests; show request status and actions. |
| Products | Product management list/table, product status and edit/delete actions. |
| Users | User list/management, search and user order history access. |
| Subscribe Email | Newsletter subscriber list/management. |
| Add Product | Product form: basic details, category/style selectors (including custom category dialogs), descriptions/care/origin, price, product settings, images/image URLs, colours, sizes and per-size stock. |
| FAQs | Store-wide FAQ management. |
| Product FAQs | Product-specific FAQ management. |
| Reviews | Product review moderation/management. |
| Shipping Price | Shipping price/currency-related settings (the current menu label is “Shipping Price”). |
| Receipt Print | Receipt/print settings and preview/configuration. |
| Notifications | Notification management. |
| Credits | Credit/balance management. |
| Payment | Payment-method management; admin-only. |
| History | Admin change/history log; admin-only. |
| Coupons | Coupon creation and management. |
| Permissions | Co-admin permission management; admin-only. |
| Admin Pass | Change administrator password; admin-only. |
| Coadmin Mgmt | Co-admin management; admin-only. |

There is also a direct route `/admin/add-kids-products` for the kids product entry UI. Treat it as a separate admin surface using the product-entry form conventions, not as a storefront page.

## Reusable components and visual behavior

- **Product card:** Product image, product name, pricing/sale information where supplied, favorite action, and add-to-cart/quick-view behavior. Cards are reused on home, listings, new arrivals, wishlist and recommendations.
- **Product grid:** Responsive columns with consistent card sizing and spacing; preserve image aspect ratios and avoid stretched product photography.
- **Filters:** Desktop refinement controls and a mobile “Refine results” sheet. Selected values appear as removable chips; provide a no-results state and a way to clear filters.
- **Skeletons:** Dedicated placeholders exist for product grids/details, cart, checkout, profile, contact form and order views. Match the eventual content geometry to reduce layout shift.
- **Forms:** Use clear field labels, required indicators, inline validation, disabled/loading button states, and persistent success/error feedback.
- **Modal/sheet patterns:** Used for password change, address editing, search and mobile filters. Keep an obvious close action and preserve the background page context.
- **Tables/lists in admin:** Keep operational information scannable; use status badges, row actions and filters without collapsing key identifiers or totals on small screens.

## Implementation map

- App routes and metadata: `nextjs/src/app/`
- Shared storefront shell: `nextjs/src/components/ClientWrapper.tsx`, `Navbar.jsx`, `Footer.jsx`, `Toast.jsx`
- Product discovery/cards: `nextjs/src/components/ProductsContent.jsx`, `ProductCard.jsx`
- Customer account/order/checkout UI: `nextjs/src/components/` (`Login.jsx`, `Register.jsx`, `Profile.tsx`, `Addresses.jsx`, `Checkout.jsx`, `Orders.jsx`, `OrderDetails.jsx`, `OrderTracking.jsx`)
- Admin console: `nextjs/src/components/admin/` (`AdminPageClient.tsx`, `Dashboard.jsx`, and section components)
- Global and responsive styles: `nextjs/src/app/globals.css`, `nextjs/src/styles/responsive.css`, and page/component CSS alongside their components.

## Handoff checklist for a redesign

1. Design the desktop and mobile versions of every route in the page inventory.
2. Include loading, empty, error, success, validation, and authenticated/unauthenticated states as applicable.
3. Keep both product-detail URLs visually identical and preserve the category redirect behavior.
4. Design all admin sections, including permission-hidden/admin-only sections, even though they share the `/admin` URL.
5. Preserve product and order actions, form requirements, filters, navigation and checkout progression.
6. Verify contrast and focus behavior in light/dark modes where supported.
