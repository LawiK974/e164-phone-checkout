<?php
/**
 * Plugin Name: E.164 Phone Checkout for WooCommerce
 * Description: Requires billing phone numbers to use the international E.164 format at checkout.
 * Version: 1.2.1
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires Plugins: woocommerce
 * Requires PHP: 7.4
 * Text Domain: e164-phone-checkout
 * Domain Path: /languages
 *
 * @package E164PhoneCheckout
 */

defined( 'ABSPATH' ) || exit;

define( 'E164_PHONE_CHECKOUT_VERSION', '1.2.1' );
define( 'E164_PHONE_CHECKOUT_INTL_TEL_INPUT_VERSION', '29.5.7' );

/**
 * Check whether a phone number uses the E.164 format.
 *
 * @param string $phone Phone number to validate.
 * @return bool
 */
function e164_phone_checkout_is_valid( $phone ) {
	return 1 === preg_match( '/^\+[1-9][0-9]{1,14}$/D', $phone );
}

/**
 * Get the shared E.164 format guidance.
 *
 * @return string
 */
function e164_phone_checkout_get_format_help() {
	return __(
		'Choose your country and enter your phone number. It will be submitted in E.164 format (e.g. +33612345678).',
		'e164-phone-checkout'
	);
}

/**
 * Configure the classic checkout phone field with an E.164 example.
 *
 * @param array $fields Checkout fields.
 * @return array
 */
function e164_phone_checkout_configure_classic_field( $fields ) {
	if ( isset( $fields['billing']['billing_phone'] ) ) {
		$fields['billing']['billing_phone']['description'] = e164_phone_checkout_get_format_help();
		$fields['billing']['billing_phone']['custom_attributes']['data-e164-phone-checkout'] = '1';
		$fields['billing']['billing_phone']['custom_attributes']['title']                    = e164_phone_checkout_get_format_help();
	}

	return $fields;
}
add_filter( 'woocommerce_checkout_fields', 'e164_phone_checkout_configure_classic_field' );

/**
 * Add visible format guidance to the Checkout Block phone field.
 */
function e164_phone_checkout_enqueue_block_field_script() {
	if ( ! function_exists( 'is_checkout' ) || ! is_checkout() ) {
		return;
	}

	wp_enqueue_style(
		'intl-tel-input',
		'https://cdn.jsdelivr.net/npm/intl-tel-input@' . E164_PHONE_CHECKOUT_INTL_TEL_INPUT_VERSION . '/dist/css/intlTelInput.min.css',
		array(),
		E164_PHONE_CHECKOUT_INTL_TEL_INPUT_VERSION
	);
	wp_enqueue_style(
		'e164-phone-checkout',
		plugins_url( 'e164-phone-checkout.css', __FILE__ ),
		array( 'intl-tel-input' ),
		E164_PHONE_CHECKOUT_VERSION
	);
	wp_enqueue_script(
		'intl-tel-input',
		'https://cdn.jsdelivr.net/npm/intl-tel-input@' . E164_PHONE_CHECKOUT_INTL_TEL_INPUT_VERSION . '/dist/js/intlTelInputWithUtils.min.js',
		array(),
		E164_PHONE_CHECKOUT_INTL_TEL_INPUT_VERSION,
		true
	);
	wp_enqueue_script(
		'e164-phone-checkout',
		plugins_url( 'e164-phone-checkout.js', __FILE__ ),
		array( 'intl-tel-input' ),
		E164_PHONE_CHECKOUT_VERSION,
		true
	);

	$billing_country = WC()->customer->get_billing_country();
	if ( ! $billing_country ) {
		$billing_country = WC()->countries->get_base_country();
	}

	wp_localize_script(
		'e164-phone-checkout',
		'e164PhoneCheckout',
		array(
			'formatHelp'    => e164_phone_checkout_get_format_help(),
			'initialCountry' => strtolower( $billing_country ),
		)
	);
}
add_action( 'wp_enqueue_scripts', 'e164_phone_checkout_enqueue_block_field_script' );

/**
 * Validate the billing phone at classic checkout.
 *
 * @param array    $data   Submitted checkout data.
 * @param WP_Error $errors Checkout validation errors.
 */
function e164_phone_checkout_validate_classic( $data, $errors ) {
	$phone = isset( $data['billing_phone'] ) ? (string) $data['billing_phone'] : '';

	if ( '' !== $phone && ! e164_phone_checkout_is_valid( $phone ) ) {
		$errors->add(
			'e164_phone_invalid',
			e164_phone_checkout_get_format_help()
		);
	}
}
add_action( 'woocommerce_after_checkout_validation', 'e164_phone_checkout_validate_classic', 10, 2 );

/**
 * Validate the billing phone submitted by the Checkout Block Store API.
 *
 * @param WC_Order        $order   Checkout order.
 * @param WP_REST_Request $request Store API request.
 * @throws Automattic\WooCommerce\StoreApi\Exceptions\RouteException When the phone is invalid.
 */
function e164_phone_checkout_validate_blocks( $order, $request ) {
	$billing_address = $request->get_param( 'billing_address' );
	$phone           = is_array( $billing_address ) && isset( $billing_address['phone'] )
		? (string) $billing_address['phone']
		: '';

	if ( '' !== $phone && ! e164_phone_checkout_is_valid( $phone ) ) {
		throw new Automattic\WooCommerce\StoreApi\Exceptions\RouteException(
			'e164_phone_invalid',
			e164_phone_checkout_get_format_help(),
			400
		);
	}
}
add_action( 'woocommerce_store_api_checkout_update_order_from_request', 'e164_phone_checkout_validate_blocks', 10, 2 );
