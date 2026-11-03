(() => {
	'use strict';

	const selector = 'input[data-e164-phone-checkout="1"], #billing_phone, #billing-phone, input[name="billing_phone"], input[name="billing_address[phone]"]';
	const instances = new WeakMap();
	const e164Pattern = /^\+[1-9][0-9]{1,14}$/;
	const trunkPrefixPattern = /^0+/;

	const getIntlTelInputOptions = () => ({
		formatAsYouType: true,
		numberDisplayFormat: 'INTERNATIONAL',
		separateDialCode: false,
	});

	const setFieldValue = (field, value) => {
		const setter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			'value'
		).set;
		setter.call(field, value);
		field.dispatchEvent(new Event('input', { bubbles: true }));
	};

	const syncCountryWithNumber = (field, iti) => {
		let selectedCountry = iti.getSelectedCountry();
		let lastDigits = field.value.replace(/\D/g, '');
		let syncingCountry = false;
		let normalizing = false;

		const ensurePlusSign = () => {
			const raw = field.value;
			if (raw.startsWith('+')) {
				return;
			}

			const digits = raw.replace(/\D/g, '');
			if (!digits) {
				return;
			}

			const dialCode = selectedCountry?.dialCode || '';
			const nationalDigits =
				dialCode && digits.startsWith(dialCode)
					? digits.slice(dialCode.length)
					: selectedCountry?.iso2 === 'it'
						? digits
						: digits.replace(trunkPrefixPattern, '');

			if (!nationalDigits) {
				return;
			}

			const value = `+${dialCode}${nationalDigits}`;
			const caret = typeof field.selectionStart === 'number' ? field.selectionStart : raw.length;

			normalizing = true;
			setFieldValue(field, value);
			normalizing = false;

			const caretPosition =
				caret >= raw.length ? value.length : Math.min(value.length, caret + value.length - raw.length);
			field.setSelectionRange(caretPosition, caretPosition);
		};

		field.addEventListener('beforeinput', (event) => {
			if (instances.get(field) !== iti || !field.value.startsWith('+')) {
				return;
			}

			const start = field.selectionStart;
			const end = field.selectionEnd;

			if (start !== 0) {
				return;
			}

			if (event.inputType === 'deleteContentBackward') {
				event.preventDefault();
				if (end > 0) {
					setFieldValue(field, `+${field.value.slice(end)}`);
				}
				field.setSelectionRange(1, 1);
				return;
			}

			if (event.inputType === 'deleteContentForward' && start === end) {
				event.preventDefault();
			}
		});

		field.addEventListener('input', () => {
			if (syncingCountry || normalizing || instances.get(field) !== iti) {
				return;
			}

			selectedCountry = iti.getSelectedCountry();
			ensurePlusSign();
			selectedCountry = iti.getSelectedCountry();
			lastDigits = field.value.replace(/\D/g, '');
		});

		field.addEventListener('countrychange', () => {
			if (syncingCountry || normalizing || instances.get(field) !== iti) {
				return;
			}

			const country = iti.getSelectedCountry();
			const digits = field.value.replace(/\D/g, '');
			if (digits !== lastDigits) {
				selectedCountry = country;
				lastDigits = digits;
				return;
			}

			const oldDialCode = selectedCountry?.dialCode || '';
			const newDialCode = country?.dialCode || '';
			if (digits && oldDialCode && newDialCode) {
				const raw = field.value.trim();
				const nationalDigits =
					raw.startsWith('+') && digits.startsWith(oldDialCode)
						? digits.slice(oldDialCode.length)
						: digits;

				syncingCountry = true;
				setFieldValue(field, `+${newDialCode}${nationalDigits}`);
				syncingCountry = false;
			}

			selectedCountry = country;
			lastDigits = field.value.replace(/\D/g, '');
		});
	};

	const configurePhoneFields = () => {
		document.querySelectorAll(selector).forEach((field) => {
			if (instances.has(field)) {
				return;
			}

			field.setAttribute('inputmode', 'tel');

			const iti = window.intlTelInput(field, getIntlTelInputOptions());
			instances.set(field, iti);
			syncCountryWithNumber(field, iti);

			field.addEventListener('blur', () => normalizeForSubmission(field, iti), true);
		});
	};

	const normalizeForSubmission = (field, iti) => {
		if (!field.value.trim()) {
			return;
		}

		const number = iti.getNumber();
		if (!e164Pattern.test(number) || field.value === number) {
			return;
		}

		iti.destroy();
		setFieldValue(field, number);
		const replacement = window.intlTelInput(field, getIntlTelInputOptions());
		instances.set(field, replacement);
		syncCountryWithNumber(field, replacement);
	};

	let resyncTimer = null;
	const scheduleWork = () => {
		if (resyncTimer) {
			clearTimeout(resyncTimer);
		}

		resyncTimer = setTimeout(() => {
			resyncTimer = null;
			configurePhoneFields();
		}, 120);
	};

	configurePhoneFields();

	new MutationObserver(scheduleWork).observe(document.body, {
		childList: true,
		subtree: true,
	});

	document.addEventListener(
		'submit',
		(event) => {
			const form = event.target;
			if (!(form instanceof HTMLFormElement)) {
				return;
			}

			form.querySelectorAll(selector).forEach((field) => {
				const iti = instances.get(field);
				if (iti) {
					normalizeForSubmission(field, iti);
				}
			});
		},
		true
	);
})();
