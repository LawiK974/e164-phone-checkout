# E.164 Phone Checkout for WooCommerce

A small WordPress plugin that formats checkout phone numbers with a country
selector and requires the submitted billing number to use E.164 format.

## Features

- Supports WooCommerce's classic checkout and Checkout Block.
- Loads [`intl-tel-input`](https://github.com/jackocnr/intl-tel-input) v29.5.7
  from jsDelivr at runtime; the library is not bundled in this repository.
- Defaults the country selector to the customer's billing country, or the
  store's base country.
- Sends phone numbers to WooCommerce in canonical E.164 format.
- Validates the final value on the server for both checkout flows.

## Requirements

- WordPress 6.5 or later
- PHP 7.4 or later
- WooCommerce
- A connection to jsDelivr so the browser can load `intl-tel-input`

## Installation

Copy this directory into `wp-content/plugins/` and activate **E.164 Phone
Checkout for WooCommerce** in the WordPress admin.

## Development

The repository root is the installable plugin directory. There is no build
step. The `intl-tel-input` version is pinned in
`e164-phone-checkout.php`; update the pin there when intentionally upgrading
the CDN dependency.

## License

This plugin is licensed under GPL-2.0-or-later. `intl-tel-input` is loaded
from its CDN and retains its separate MIT license.
