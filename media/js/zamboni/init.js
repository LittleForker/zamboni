/* Global initialization script */
var z = {};

$(document).ready(function(){

    // Initialize install buttons.
    $('.install').installButton();
    if ($('.backup-button').length) {
        $('.backup-button').showBackupButton();
    }

    // Initialize any tabbed interfaces.  See: tabs.js
    if ($.fn.tabify) {
        $('.tab-wrapper').tabify();
    }

    // Initialize email links
    $('span.emaillink').each(function() {
        $(this).find('.i').remove();
        var em = $(this).text().split('').reverse().join('');
        $(this).prev('a').attr('href', 'mailto:' + em);
    });

    // fake placeholders if we need to.
    if (!('placeholder' in document.createElement('input'))) {
        $('input[placeholder]').placeholder();
    }

    if (z.readonly) {
        $('form[method=post]')
            .before(gettext('This feature is temporarily disabled while we perform website maintenance. Please check back a little later.'))
            .find('input, button, select').attr('disabled', true);
    }
});

z.inlineSVG = (function() {
  var e = document.createElement('div');
  e.innerHTML = '<svg></svg>';
  return !!(window.SVGSVGElement && e.firstChild instanceof window.SVGSVGElement);
})();
if (!z.inlineSVG) {
    $("body").addClass("noInlineSVG");
}


/* prevent-default function wrapper */
function _pd(func) {
    return function(e) {
        e.preventDefault();
        func.apply(this, arguments);
    };
}


/* Fake the placeholder attribute since Firefox 3.6 doesn't support it. */
jQuery.fn.placeholder = function(new_value) {

    if (new_value) {
        this.attr('placeholder', new_value);
    }

    /* Bail early if we have built-in placeholder support. */
    if ('placeholder' in document.createElement('input')) {
        return this;
    }

    if (new_value && this.hasClass('placeholder')) {
        this.val('').blur();
    }

    return this.focus(function() {
        var $this = $(this),
            text = $this.attr('placeholder');

        if ($this.val() == text) {
            $this.val('').removeClass('placeholder');
        }
    }).blur(function() {
        var $this = $(this),
            text = $this.attr('placeholder');

        if ($this.val() == '') {
            $this.val(text).addClass('placeholder');
        }
    }).each(function(){
        /* Remove the placeholder text before submitting the form. */
        var self = $(this);
        self.closest('form').submit(function() {
            if (self.hasClass('placeholder')) {
                self.val('');
            }
        });
    }).blur();
};


jQuery.fn.hasattr = function(name) {
    return this.attr(name) !== undefined;
}


var escape_ = function(s){
    return s.replace('&', '&amp;').replace('>', '&gt;').replace('<', '&lt;')
            .replace("'", '&#39;').replace('"', '&#34;');
};

//TODO(potch): kill underscore dead. until then, fake it on mobile.
if (!('_' in window)) _ = {};
/* is ``key`` in obj? */
_.haskey = function(obj, key) {
    return typeof obj[key] !== "undefined";
};


/* Detect browser, version, and OS. */
$.extend(z, BrowserUtils());
$(document.body).addClass(z.platform);


/* Details for the current application. */
z.app = document.body.getAttribute('data-app');
z.appName = document.body.getAttribute('data-appname');
z.appMatchesUserAgent = z.browser[z.app];

z.anonymous = JSON.parse(document.body.getAttribute('data-anonymous'))

z.media_url = document.body.getAttribute('data-media-url');

z.readonly = JSON.parse(document.body.getAttribute('data-readonly'));

if (z.browser.firefox) {
    var betaVer = document.body.getAttribute('data-min-beta-version');
    z.fxBeta = (VersionCompare.compareVersions(z.browserVersion, betaVer) > -1);
    if (z.fxBeta) {
        $(document.body).addClass('fxbeta');
    }
} else {
    z.fxBeta = false;
}

if (z.badBrowser) {
    $(".get-fx-message").show();
}