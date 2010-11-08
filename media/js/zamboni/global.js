// Things global to the site should go here, such as re-usable helper
// functions and common ui components.


// Tooltip display. If you give an element a class of 'tooltip', it will
// display a tooltip on hover. The contents of the tip will be the element's
// title attriubute OR the first title attribute in its children. titles are
// swapped out by the code so the native title doesn't display. If the title of
// the element is changed while the tooltip is displayed, you can update the
// tooltip by with the following:
//      $el.trigger("tooltip_change");
jQuery.fn.tooltip = function(tip_el) {
    var $tip = $(tip_el),
        $msg = $('span', $tip),
        $targets = this,
        timeout = false,
        $tgt, $title;

    function setTip() {
        if (!$tgt) return;
        var pos = $tgt.offset();

        $msg.text($title.attr("title"));
        $title.attr('data-oldtitle', $title.attr('title')).attr('title', '');

        var tw  = $tip.outerWidth() / 2,
            th  = $tip.outerHeight() - 8,
            toX = pos.left + $tgt.innerWidth() / 2 - tw,
            toY = pos.top - $tgt.innerHeight() - th - 1;

        timeout = setTimeout(function () {
            $tip.css({
                left:   toX + "px",
                top:    toY + "px"
            }).show();
        }, 300);
    }

    $(document.body).bind("tooltip_change", setTip);
    $targets.live("mouseover", function (e) {
        $tgt = $(this);
        if ($tgt.hasClass("formerror")) $tip.addClass("error");
        $title = $tgt.attr('title') ? $tgt : $("[title]", $tgt).first();
        if ($title.length) {
            setTip();
        }
    }).live("mouseout", function (e) {
        clearTimeout(timeout);
        $tip.hide()
            .removeClass("error");
        if ($title && $title.length) {
            $tgt = $(this);
            $title.attr('title', $title.attr('data-oldtitle'))
                  .attr('data-oldtitle', '');
        }
    });
};

// Setting up site tooltips.
$(document).ready(function() {
    $(".tooltip").tooltip("#tooltip");
});


// returns an event handler that will hide/unbind an element when a click is
// registered outside itself.
function makeBlurHideCallback(el) {
    var hider = function(e) {
        _root = el.get(0);
        // Bail if the click was somewhere on the popup.
        if (e) {
            if (e.type == 'click' &&
                _root == e.target ||
                _.indexOf($(e.target).parents(), _root) != -1) {
                return;
            }
        }
        el.hide();
        el.unbind();
        el.undelegate();
        $(document.body).unbind('click newPopup', hider);
    };
    return hider;
}


// makes an element into a popup.
// click_target defines the element/elements that trigger the popup.
// currently presumes the given element uses the '.popup' style
// o takes the following optional fields:
//     callback:    a function to run before displaying the popup. Returning
//                  false from the function cancels the popup.
//     container:   if set the popup will be appended to the container before
//                  being displayed.
//     pointTo:     if set, the popup will be appended to document.body and
//                  absolutely positioned to point at the given element
//     width:       the width of the popup.
//     delegate:    delegates the click handling of the click_target to the
//                  specified parent element.
//     hideme:      defaults to true, if set to false, popup will not be hidden
//                  when the user clicks outside of it.
// note: all options may be overridden and modified by returning them in an
//       object from the callback.
$.fn.popup = function(click_target, o) {
    o = o || {};

    var $ct         = $(click_target),
        $popup      = this;

    $popup.o = $.extend({
        delegate:   false,
        callback:   false,
        container:  false,
        hideme:     true,
        pointTo:    false,
        offset:     {},
        width:      300
    }, o);

    $popup.setWidth = function(w) {
        $popup.css({width: w});
        return $popup;
    }

    $popup.setPos = function(el, offset) {
        offset = offset || $popup.o.offset;
        el = el || $popup.o.pointTo;
        if (!el) return;
        $popup.detach().appendTo("body");
        var pt  = $(el),
            pos = pt.offset(),
            tw  = pt.outerWidth() / 2,
            th  = pt.outerHeight(),
            pm  = pos.left + tw > $("body").outerWidth() / 2,
            os  = pm ? $popup.outerWidth() - 84 : 63,
            toX = pos.left + (offset.x || tw) - os,
            toY = pos.top + (offset.y || th) + 4;
        $popup.removeClass("left");
        if (pm)
            $popup.addClass("left");
        $popup.css({
            'left': toX,
            'top': toY,
            'right': 'inherit',
            'bottom': 'inherit',
        });
        $popup.o.pointTo = el;
        return $popup;
    };

    $popup.hideMe = function() {
        $popup.hide();
        $popup.unbind();
        $popup.undelegate();
        $(document.body).unbind('click newPopup', $popup.hider);
        return $popup;
    };

    function handler(e) {
        e.preventDefault();
        var resp = o.callback ? (o.callback.call($popup, {
                click_target: this,
                evt: e
            })) : true;
        $popup.o = $.extend({click_target: this}, $popup.o, resp);
        if (resp) {
            $popup.render();
        }
    }

    $popup.render = function() {
        var p = $popup.o;
        $popup.hider = makeBlurHideCallback($popup);
        if (p.hideme) {
            setTimeout(function(){
                $(document.body).bind('click popup', $popup.hider);
            }, 0);
        }
        $ct.trigger("popup_show", [$popup]);
        if (p.container && p.container.length)
            $popup.detach().appendTo(p.container);
        if (p.pointTo) {
            $popup.setPos(p.pointTo);
        }
        setTimeout(function(){
            $popup.show();
        }, 0);
        return $popup;
    };

    if ($popup.o.delegate) {
        $($popup.o.delegate).delegate(click_target, "click", handler);
    } else {
        $ct.click(handler);
    }

    $popup.setWidth($popup.o.width);

    return $popup;
};


// makes an element into a modal.
// click_target defines the element/elements that trigger the modal.
// currently presumes the given element uses the '.modal' style
// o takes the following optional fields:
//     callback:    a function to run before displaying the modal. Returning
//                  false from the function cancels the modal.
//     container:   if set the modal will be appended to the container before
//                  being displayed.
//     width:       the width of the modal.
//     delegate:    delegates the click handling of the click_target to the
//                  specified parent element.
//     hideme:      defaults to true, if set to false, modal will not be hidden
//                  when the user clicks outside of it.
// note: all options may be overridden and modified by returning them in an
//       object from the callback.
$.fn.modal = function(click_target, o) {
    o = o || {};

    var $ct         = $(click_target),
        $modal      = this;

    $modal.o = $.extend({
        delegate:   false,
        callback:   false,
        onresize:   function(){$modal.setPos();},
        hideme:     true,
        emptyme:    false,
        offset:     {},
        width:      450
    }, o);

    $modal.setWidth = function(w) {
        $modal.css({width: w});
        return $modal;
    }

    $modal.setPos = function(offset) {
        offset = offset || $modal.o.offset;

        $modal.detach().appendTo("body");
        var toX = ($(window).width() - $modal.outerWidth()) / 2,
            toY = ($(window).height() - $modal.outerHeight()) / 2;
        $modal.css({
            'left': toX,
            'top': toY,
            'right': 'inherit',
            'bottom': 'inherit',
            'position': 'fixed'
        });
        return $modal;
    };

    $modal.hideMe = function() {
        var p = $modal.o;
        $modal.hide();
        $modal.unbind();
        $modal.undelegate();
        $(document.body).unbind('click newmodal', $modal.hider);
        $(window).bind('resize', $modal.o.onresize);
        $('.modal-overlay').remove();
        if (p.emptyme) {
            $modal.empty();
        }
        return $modal;
    };

    function handler(e) {
        e.preventDefault();
        var resp = o.callback ? (o.callback.call($modal, {
                click_target: this,
                evt: e
            })) : true;
        $modal.o = $.extend({click_target: this}, $modal.o, resp);
        if (resp) {
            $modal.render();
        }
    }

    $modal.render = function() {
        var p = $modal.o;
        $modal.hider = makeBlurHideCallback($modal);
        if (p.hideme) {
            setTimeout(function(){
                $(document.body).bind('click modal', $modal.hider);
            }, 0);
        }
        $modal.delegate('.close', 'click', function(e){
            e.preventDefault();
            $modal.hideMe();
        });
        $ct.trigger("modal_show", [$modal]);
        if (p.container && p.container.length)
            $modal.detach().appendTo(p.container);
        $('<div class="modal-overlay"></div>').appendTo('body');
        $modal.setPos();
        setTimeout(function(){
            $modal.show();
        }, 0);

        $(window).bind('resize', p.onresize);
        return $modal;
    };

    if ($modal.o.delegate) {
        $($modal.o.delegate).delegate(click_target, "click", handler);
    } else {
        $ct.click(handler);
    }

    $modal.setWidth($modal.o.width);

    return $modal;
};
