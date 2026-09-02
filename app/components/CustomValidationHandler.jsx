"use client";

import { useEffect } from 'react';

export default function CustomValidationHandler() {
  useEffect(() => {
    let currentTooltip = null;
    let currentInput = null;
    let dismissTimeout = null;

    const removeTooltip = () => {
      if (dismissTimeout) {
        clearTimeout(dismissTimeout);
        dismissTimeout = null;
      }
      if (currentTooltip) {
        currentTooltip.classList.add('dripp-tooltip-hide');
        const tooltipToRemove = currentTooltip;
        setTimeout(() => {
          tooltipToRemove.remove();
        }, 200);
        currentTooltip = null;
      }
      if (currentInput) {
        currentInput.classList.remove('dripp-input-invalid');
        currentInput = null;
      }
    };

    const updatePosition = () => {
      if (!currentTooltip || !currentInput) return;
      const rect = currentInput.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        removeTooltip();
        return;
      }

      const tooltipRect = currentTooltip.getBoundingClientRect();
      const margin = 8;

      // Calculate top/left
      let top = rect.bottom + margin;
      let isTop = false;

      // If overflowing bottom of viewport, place above input
      if (top + tooltipRect.height > window.innerHeight - 10 && rect.top - tooltipRect.height - margin > 10) {
        top = rect.top - tooltipRect.height - margin;
        isTop = true;
      }

      let left = rect.left + Math.min(20, Math.max(0, (rect.width - tooltipRect.width) / 2));
      // Clamp within viewport
      if (left + tooltipRect.width > window.innerWidth - 15) {
        left = window.innerWidth - tooltipRect.width - 15;
      }
      if (left < 15) left = 15;

      currentTooltip.style.top = `${top}px`;
      currentTooltip.style.left = `${left}px`;

      if (isTop) {
        currentTooltip.classList.add('placement-top');
        currentTooltip.classList.remove('placement-bottom');
      } else {
        currentTooltip.classList.add('placement-bottom');
        currentTooltip.classList.remove('placement-top');
      }
    };

    const handleInvalid = (e) => {
      const input = e.target;
      if (!input || !(input instanceof HTMLElement)) return;

      // Prevent native browser popup bubble
      e.preventDefault();

      removeTooltip();

      // Determine clear brand-styled message
      let message = input.validationMessage || 'Please fill out this field.';
      if (input.validity) {
        if (input.validity.valueMissing) {
          message = 'Please fill out this field.';
        } else if (input.validity.typeMismatch && input.type === 'email') {
          message = 'Please enter a valid email address.';
        } else if (input.validity.patternMismatch) {
          message = 'Please match the requested format.';
        }
      }

      // Create custom Dripp Media tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'dripp-validation-tooltip placement-bottom';
      tooltip.setAttribute('role', 'alert');
      tooltip.innerHTML = `
        <div class="dripp-tooltip-arrow"></div>
        <div class="dripp-tooltip-badge">!</div>
        <div class="dripp-tooltip-text">${message}</div>
      `;

      document.body.appendChild(tooltip);
      currentTooltip = tooltip;
      currentInput = input;

      // Apply invalid shake effect
      input.classList.add('dripp-input-invalid');

      // Position tooltip
      updatePosition();

      // Focus input
      input.focus({ preventScroll: false });

      // Dismiss on input or change
      const onFieldInput = () => {
        removeTooltip();
        input.removeEventListener('input', onFieldInput);
        input.removeEventListener('change', onFieldInput);
      };
      input.addEventListener('input', onFieldInput);
      input.addEventListener('change', onFieldInput);

      // Dismiss on clicking the tooltip
      tooltip.addEventListener('click', () => removeTooltip());

      // Auto dismiss after 4.5s
      dismissTimeout = setTimeout(removeTooltip, 4500);
    };

    // Capture invalid events everywhere on the page
    document.addEventListener('invalid', handleInvalid, true);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    // Dismiss on click outside
    const handleDocumentClick = (e) => {
      if (currentTooltip && !currentTooltip.contains(e.target) && currentInput !== e.target) {
        removeTooltip();
      }
    };
    document.addEventListener('pointerdown', handleDocumentClick);

    return () => {
      document.removeEventListener('invalid', handleInvalid, true);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('pointerdown', handleDocumentClick);
      removeTooltip();
    };
  }, []);

  return null;
}
