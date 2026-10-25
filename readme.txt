=== E.164 Phone Checkout for WooCommerce ===
Plugin link:  https://github.com/LawiK974/e164-phone-checkout
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.2.1
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Formats WooCommerce checkout phone numbers with a country selector and requires E.164 format.

== Description ==

Adds the intl-tel-input country selector and phone formatting to the classic WooCommerce checkout and Checkout Block. The selected country defaults to the customer's billing country, or the store's base country.

The phone is submitted in E.164 format and validated on the server for both checkout types. The intl-tel-input v29.5.7 library is loaded from jsDelivr at runtime and is not bundled with this plugin.

== Installation ==

1. Copy the plugin directory into `/wp-content/plugins/`.
2. Activate **E.164 Phone Checkout for WooCommerce** in the WordPress admin.
3. Ensure the site can load JavaScript and CSS from jsDelivr.

== Frequently Asked Questions ==

= Does this support the Checkout Block? =

Yes. The plugin supports both the classic shortcode checkout and the WooCommerce Checkout Block.

= Is the phone library bundled with the plugin? =

No. The pinned intl-tel-input v29.5.7 assets are loaded from jsDelivr, so no copy of the third-party library needs to be maintained in this repository.

== Changelog ==

= 1.2.1 =
* Fix country search icon overlapping the search text.

= 1.2.0 =
* Load intl-tel-input from the pinned jsDelivr release instead of bundling library files.
* Add country selection and E.164 formatting to both checkout types.

= 1.1.0 =
* Add Checkout Block support and shared E.164 guidance.

= 1.0.0 =
* Require E.164 billing phone numbers at checkout.
