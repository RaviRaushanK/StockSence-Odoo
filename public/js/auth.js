(() => {
  const RESEND_COOLDOWN_SECONDS = 60;

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    const input = button.closest('.ss-field__control')?.querySelector('[data-password-input]');
    const icon = button.querySelector('i');

    if (!input) return;

    button.addEventListener('click', () => {
      const revealed = input.type === 'text';

      input.type = revealed ? 'password' : 'text';
      icon.classList.toggle('bi-eye', revealed);
      icon.classList.toggle('bi-eye-slash', !revealed);
      button.setAttribute('aria-pressed', String(!revealed));
      button.setAttribute('aria-label', revealed ? 'Show password' : 'Hide password');
    });
  });

  document.querySelectorAll('[data-password-rules]').forEach((rules) => {
    const input = document.querySelector(`[data-password-field="${rules.dataset.passwordRules}"]`);
    if (!input) return;

    const update = () => {
      const value = input.value;
      const met = {
        length: value.length >= 8,
        letter: /[A-Za-z]/.test(value),
        number: /\d/.test(value),
      };

      rules.querySelectorAll('[data-rule]').forEach((item) => {
        const isMet = met[item.dataset.rule];

        item.classList.toggle('ss-password-rules__item--met', isMet);
        item.querySelector('i').className = `bi ${isMet ? 'bi-check-circle-fill' : 'bi-circle'}`;
      });
    };

    input.addEventListener('input', update);
  });

  const digits = Array.from(document.querySelectorAll('[data-otp-digit]'));
  const otpValue = document.querySelector('[data-otp-value]');

  if (digits.length > 0) {
    const sync = () => {
      otpValue.value = digits.map((input) => input.value).join('');
    };

    digits.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);

        if (input.value && index < digits.length - 1) {
          digits[index + 1].focus();
        }

        sync();
      });

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !input.value && index > 0) {
          digits[index - 1].focus();
        }
      });

      input.addEventListener('paste', (event) => {
        const pasted = event.clipboardData.getData('text').replace(/\D/g, '');

        if (!pasted) return;

        event.preventDefault();
        pasted.split('').forEach((digit, position) => {
          if (digits[position]) digits[position].value = digit;
        });
        digits[Math.min(pasted.length, digits.length - 1)].focus();
        sync();
      });
    });

    if (otpValue.value) {
      otpValue.value.split('').forEach((digit, index) => {
        if (digits[index]) digits[index].value = digit;
      });
    }
  }

  const resendButton = document.querySelector('[data-otp-resend]');
  const resendForm = document.querySelector('[data-otp-resend-form]');
  const countdown = document.querySelector('[data-otp-countdown]');

  if (resendButton && resendForm && countdown) {
    let secondsLeft = RESEND_COOLDOWN_SECONDS;

    const tick = () => {
      if (secondsLeft <= 0) {
        countdown.textContent = 'You can request a new code.';
        resendButton.disabled = false;
        return;
      }

      countdown.textContent = `Resend available in ${secondsLeft}s`;
      secondsLeft -= 1;
      setTimeout(tick, 1000);
    };

    resendButton.addEventListener('click', () => resendForm.submit());

    tick();
  }

  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', () => {
      const button = form.querySelector('[data-submit-button]');
      if (!button || button.disabled) return;

      button.disabled = true;
      button.querySelector('[data-submit-label]').textContent = 'Please wait...';
    });
  });
})();