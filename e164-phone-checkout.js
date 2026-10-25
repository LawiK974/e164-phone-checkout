(() => {
	'use strict';

	const selector = 'input[data-e164-phone-checkout="1"], #billing_phone, #billing-phone, input[name="billing_phone"], input[name="billing_address[phone]"]';
	const instances = new WeakMap();
	const e164Pattern = /^\+[1-9][0-9]{1,14}$/;

	const getIntlTelInputOptions = () => ({
		formatAsYouType: true,
		initialCountry: e164PhoneCheckout.initialCountry,
		numberDisplayFormat: 'INTERNATIONAL',
		separateDialCode: false,
	});

	const configurePhoneFields = () => {
		document.querySelectorAll(selector).forEach((field) => {
			if (instances.has(field)) {
				return;
			}

			field.setAttribute('title', e164PhoneCheckout.formatHelp);
			field.setAttribute('inputmode', 'tel');

			const iti = window.intlTelInput(field, getIntlTelInputOptions());
			instances.set(field, iti);

			const helpId = `${field.id || field.name || 'billing-phone'}-e164-help`;
			let help = field.id === 'billing_phone'
				? field.closest('.form-row')?.querySelector('.description')
				: document.getElementById(helpId);

			if (!help && field.id !== 'billing_phone') {
				help = document.createElement('p');
				help.id = helpId;
				help.className = 'e164-phone-checkout__help';
				help.textContent = e164PhoneCheckout.formatHelp;
				const wrapper = field.closest('.iti') || field;
				wrapper.insertAdjacentElement('afterend', help);
			}

			if (help) {
				if (!help.id) {
					help.id = helpId;
				}
				const describedBy = new Set(
					(field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
				);
				describedBy.add(help.id);
				field.setAttribute('aria-describedby', Array.from(describedBy).join(' '));
			}

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

		const setter = Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			'value'
		).set;
		iti.destroy();
		setter.call(field, number);
		field.dispatchEvent(new Event('input', { bubbles: true }));
		instances.set(field, window.intlTelInput(field, getIntlTelInputOptions()));
	};

	configurePhoneFields();

	new MutationObserver(configurePhoneFields).observe(document.body, {
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
