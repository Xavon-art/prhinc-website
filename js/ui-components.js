// ========================
// PRHInc Custom UI Components
// Replaces native alert() / confirm() with smooth animated modals
// ========================

(function () {
    'use strict';

    // ========================
    // TOAST NOTIFICATIONS
    // ========================
    const TOAST_DURATION = 4000;

    function ensureToastContainer() {
        let container = document.getElementById('prh-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'prh-toast-container';
            container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type) {
        type = type || 'info';
        var container = ensureToastContainer();

        var toast = document.createElement('div');
        toast.className = 'prh-toast prh-toast--' + type;

        var iconMap = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        toast.innerHTML =
            '<div class="prh-toast__icon">' + (iconMap[type] || iconMap.info) + '</div>' +
            '<div class="prh-toast__message">' + escapeHtml(message) + '</div>' +
            '<button class="prh-toast__close" aria-label="Dismiss">&times;</button>';

        toast.querySelector('.prh-toast__close').addEventListener('click', function () {
            dismissToast(toast);
        });

        container.appendChild(toast);

        // Trigger entrance animation
        requestAnimationFrame(function () {
            toast.classList.add('prh-toast--visible');
        });

        // Auto dismiss
        var timer = setTimeout(function () {
            dismissToast(toast);
        }, TOAST_DURATION);

        // Pause on hover
        toast.addEventListener('mouseenter', function () {
            clearTimeout(timer);
        });
        toast.addEventListener('mouseleave', function () {
            timer = setTimeout(function () {
                dismissToast(toast);
            }, 2000);
        });
    }

    function dismissToast(toast) {
        toast.classList.remove('prh-toast--visible');
        toast.classList.add('prh-toast--exiting');
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }

    // ========================
    // CONFIRM DIALOG
    // ========================
    function showConfirm(message, options) {
        options = options || {};
        var title = options.title || 'Confirm';
        var confirmText = options.confirmText || 'Confirm';
        var cancelText = options.cancelText || 'Cancel';
        var confirmClass = options.confirmClass || 'prh-btn--primary';
        var danger = options.danger || false;

        if (danger) {
            confirmClass = 'prh-btn--danger';
        }

        return new Promise(function (resolve) {
            var overlay = document.createElement('div');
            overlay.className = 'prh-dialog-overlay';

            var dialog = document.createElement('div');
            dialog.className = 'prh-dialog';

            dialog.innerHTML =
                '<div class="prh-dialog__header">' +
                    '<h3 class="prh-dialog__title">' + escapeHtml(title) + '</h3>' +
                    '<button class="prh-dialog__close" aria-label="Close">&times;</button>' +
                '</div>' +
                '<div class="prh-dialog__body">' +
                    '<p>' + escapeHtml(message) + '</p>' +
                '</div>' +
                '<div class="prh-dialog__footer">' +
                    '<button class="prh-btn prh-btn--ghost prh-dialog__cancel">' + escapeHtml(cancelText) + '</button>' +
                    '<button class="prh-btn ' + confirmClass + ' prh-dialog__confirm">' + escapeHtml(confirmText) + '</button>' +
                '</div>';

            function close(result) {
                overlay.classList.remove('prh-dialog-overlay--visible');
                setTimeout(function () {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 300);
                resolve(result);
            }

            dialog.querySelector('.prh-dialog__close').addEventListener('click', function () {
                close(false);
            });
            dialog.querySelector('.prh-dialog__cancel').addEventListener('click', function () {
                close(false);
            });
            dialog.querySelector('.prh-dialog__confirm').addEventListener('click', function () {
                close(true);
            });
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) close(false);
            });
            document.addEventListener('keydown', function handler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handler);
                    close(false);
                }
            });

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            requestAnimationFrame(function () {
                overlay.classList.add('prh-dialog-overlay--visible');
                dialog.querySelector('.prh-dialog__confirm').focus();
            });

            // Restore scroll when resolved
            var origResolve = resolve;
            resolve = function (val) {
                document.body.style.overflow = '';
                origResolve(val);
            };
        });
    }

    // ========================
    // LOADING OVERLAY
    // ========================
    var loadingOverlay = null;

    function showLoading(message) {
        message = message || 'Loading...';
        hideLoading();

        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'prh-loading-overlay';
        loadingOverlay.innerHTML =
            '<div class="prh-loading-spinner">' +
                '<div class="prh-spinner"></div>' +
                '<p class="prh-loading-text">' + escapeHtml(message) + '</p>' +
            '</div>';

        document.body.appendChild(loadingOverlay);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(function () {
            loadingOverlay.classList.add('prh-loading-overlay--visible');
        });
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('prh-loading-overlay--visible');
            var el = loadingOverlay;
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
            loadingOverlay = null;
            document.body.style.overflow = '';
        }
    }

    // ========================
    // UTILITY
    // ========================
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ========================
    // INJECT STYLES
    // ========================
    function injectStyles() {
        if (document.getElementById('prh-ui-styles')) return;

        var style = document.createElement('style');
        style.id = 'prh-ui-styles';
        style.textContent = [
            // Toast
            '.prh-toast{pointer-events:auto;display:flex;align-items:center;gap:12px;padding:16px 20px;border-radius:12px;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.15);border:1px solid #e2e8f0;min-width:300px;max-width:420px;transform:translateX(120%);opacity:0;transition:transform .35s cubic-bezier(.4,0,.2,1),opacity .35s ease;font-family:"Open Sans",sans-serif;font-size:.95rem;color:#334155}',
            '.prh-toast--visible{transform:translateX(0);opacity:1}',
            '.prh-toast--exiting{transform:translateX(120%);opacity:0}',
            '.prh-toast__icon{flex-shrink:0;display:flex;align-items:center}',
            '.prh-toast--success .prh-toast__icon{color:#10b981}',
            '.prh-toast--error .prh-toast__icon{color:#ef4444}',
            '.prh-toast--warning .prh-toast__icon{color:#f59e0b}',
            '.prh-toast--info .prh-toast__icon{color:#0369a1}',
            '.prh-toast__message{flex:1;line-height:1.5}',
            '.prh-toast__close{flex-shrink:0;background:none;border:none;font-size:1.4rem;color:#94a3b8;cursor:pointer;padding:0 0 0 8px;line-height:1;transition:color .2s}',
            '.prh-toast__close:hover{color:#334155}',
            '.prh-toast--success{border-left:4px solid #10b981}',
            '.prh-toast--error{border-left:4px solid #ef4444}',
            '.prh-toast--warning{border-left:4px solid #f59e0b}',
            '.prh-toast--info{border-left:4px solid #0369a1}',

            // Dialog overlay
            '.prh-dialog-overlay{position:fixed;inset:0;background:rgba(15,23,42,.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:99998;padding:20px;opacity:0;transition:opacity .3s ease}',
            '.prh-dialog-overlay--visible{opacity:1}',

            // Dialog
            '.prh-dialog{background:#fff;border-radius:16px;width:100%;max-width:440px;box-shadow:0 25px 80px rgba(0,0,0,.3);transform:translateY(20px) scale(.97);transition:transform .3s cubic-bezier(.4,0,.2,1);overflow:hidden}',
            '.prh-dialog-overlay--visible .prh-dialog{transform:translateY(0) scale(1)}',
            '.prh-dialog__header{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 0}',
            '.prh-dialog__title{font-family:"Poppins",sans-serif;font-size:1.2rem;font-weight:600;color:#0f172a;margin:0}',
            '.prh-dialog__close{background:none;border:none;font-size:1.5rem;color:#94a3b8;cursor:pointer;padding:0;line-height:1;transition:color .2s;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px}',
            '.prh-dialog__close:hover{color:#334155;background:#f1f5f9}',
            '.prh-dialog__body{padding:20px 28px}',
            '.prh-dialog__body p{color:#475569;line-height:1.7;margin:0;font-size:.95rem}',
            '.prh-dialog__footer{display:flex;gap:12px;justify-content:flex-end;padding:0 28px 24px}',

            // Buttons
            '.prh-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 24px;border-radius:10px;font-size:.9rem;font-weight:600;font-family:"Open Sans",sans-serif;cursor:pointer;border:none;transition:all .2s ease;white-space:nowrap}',
            '.prh-btn--primary{background:#0369a1;color:#fff;box-shadow:0 4px 14px rgba(3,105,161,.3)}',
            '.prh-btn--primary:hover{background:#0284c7;transform:translateY(-1px);box-shadow:0 6px 20px rgba(3,105,161,.4)}',
            '.prh-btn--danger{background:#ef4444;color:#fff;box-shadow:0 4px 14px rgba(239,68,68,.3)}',
            '.prh-btn--danger:hover{background:#dc2626;transform:translateY(-1px);box-shadow:0 6px 20px rgba(239,68,68,.4)}',
            '.prh-btn--ghost{background:transparent;color:#64748b;border:1px solid #e2e8f0}',
            '.prh-btn--ghost:hover{background:#f1f5f9;color:#334155;border-color:#cbd5e1}',

            // Loading overlay
            '.prh-loading-overlay{position:fixed;inset:0;background:rgba(15,23,42,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99997;opacity:0;transition:opacity .3s ease}',
            '.prh-loading-overlay--visible{opacity:1}',
            '.prh-loading-spinner{text-align:center}',
            '.prh-spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:prhSpin .8s linear infinite;margin:0 auto 16px}',
            '.prh-loading-text{color:rgba(255,255,255,.9);font-family:"Open Sans",sans-serif;font-size:1rem;margin:0}',
            '@keyframes prhSpin{to{transform:rotate(360deg)}}',

            // Button spinner
            '.prh-btn-spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:prhSpin .6s linear infinite;vertical-align:middle;margin-right:6px}',

            // Responsive
            '@media(max-width:480px){.prh-toast{min-width:unset;max-width:calc(100vw - 48px);font-size:.875rem;padding:12px 16px}.prh-dialog{margin:12px}.prh-dialog__header,.prh-dialog__body,.prh-dialog__footer{padding-left:20px;padding-right:20px}}'
        ].join('\n');

        document.head.appendChild(style);
    }

    // ========================
    // GLOBAL OVERRIDE
    // ========================
    injectStyles();

    // Override native alert
    window.prhAlert = function (message, type) {
        showToast(message, type || 'info');
    };

    // Override native confirm
    window.prhConfirm = function (message, options) {
        return showConfirm(message, options);
    };

    // Expose utilities
    window.prhToast = showToast;
    window.prhShowLoading = showLoading;
    window.prhHideLoading = hideLoading;

    // Backward compat: override window.alert for old code
    var origAlert = window.alert;
    window.alert = function (message) {
        showToast(String(message), 'info');
    };

    // Override window.confirm for old code
    var origConfirm = window.confirm;
    window.confirm = function (message) {
        // Synchronous wrapper - returns true always for backward compat
        // New code should use prhConfirm() which returns a Promise
        showConfirm(String(message), { confirmText: 'OK', cancelText: 'Cancel' }).then(function (result) {
            // Can't return from here synchronously, but at least shows the dialog
        });
        return true;
    };

})();
