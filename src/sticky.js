(function (window, $, undefined) {

    var
        doc = $(document),
        stickyPrefix = ['-webkit-', '-ms-', '-o-', '-moz-', ''],
        guid = 0,

        ua = (window.navigator.userAgent || '').toLowerCase(),
        isIE = ua.indexOf('msie') !== -1,
        isIE6 = ua.indexOf('msie 6') !== -1,

        isPositionStickySupported = isPositionStickySupported(),
        isPositionFixedSupported = !isIE6;


    function Sticky(options) {
        this.options = options || {};
        this.elem = $(this.options.element);
        this.callback = this.options.callback || function () {
        };
        this.position = this.options.position;
        this.stickyId = guid++;
    }

    Sticky.prototype.adjust = function () {
        // save element's origin position
        var offset = this.elem.offset();

        this.originLeft = offset.left;
        this.originWidth = this.elem.width();
        this.ghost = this.elem.clone(true);

        var parent = this.elem.parent(),
            top = this.position.top,
            bottom = this.position.bottom,
            left = this.position.left,
            right = this.position.right;

        if (top !== undefined) {
            // margin-top 不计，但考虑 margin-bottom
            this.startY = int(offset.top - top);
            this.endY = int(parent.offset().top
                + parent.outerHeight() - int(parent.css('border-top-width')) - int(parent.css('border-bottom-width'))
                - this.elem.outerHeight()
                - (int(parent.css('padding-bottom')) + int(this.elem.css('margin-bottom')))
                - top);

        } else if (bottom !== undefined) {
            this.startY = int(parent.offset().top + int(parent.css('padding-top')) + int(this.elem.css('margin-top')) + this.elem.outerHeight() - $(window).height());
            this.endY = int(offset.top + bottom + this.elem.outerHeight() - $(window).height());
        }
        console.log('startY: ' + this.startY);
        console.log('endY: ' + this.endY);
    };

    Sticky.prototype.render = function () {
        // only bind once
        if (!this.elem.length || this.elem.data('bind-sticked')) {
            return this;
        }

        this.adjust();

        var self = this;

        var scrollCallback = function () {

            var scrollTop = doc.scrollTop(),
                top = this.position.top,
                bottom = this.position.bottom;


            if (top != undefined) { // sticky top
                if (scrollTop > self.startY && scrollTop < self.endY) {
                    self.startStick();
                    self.ghost.css({
                        position: 'fixed',
                        width: self.originWidth,
                        top: top
                    });
                } else if (scrollTop <= self.startY) {
                    self.stopStick();
                } else if (scrollTop >= self.endY) {
                    self.startStick();
                    self.ghost.offset({
//                        left: self.originLeft,
                        top: self.endY + top
                    });
                }

            } else if (bottom != undefined) { // sticky bottom

                console.log(scrollTop);
                if (scrollTop > self.startY && scrollTop < self.endY) {
                    console.log('sticking');
                    self.startStick();
                    self.ghost.css({
                        position: 'fixed',
                        width: self.originWidth,
                        top: '',
                        bottom: bottom
                    });
                } else if (scrollTop >= self.endY) {
                    console.log('stopped');
                    self.stopStick();
                } else if (scrollTop <= self.startY) {
                    console.log('pinned');
                    self.startStick();
                    self.ghost.css({
                        bottom: ''
                    });
                    self.ghost.offset({
                        top: self.startY + $(window).height() - self.elem.outerHeight() - bottom
                    });
                }
            }
        };

        $(window).on('scroll.sticky' + this.stickyId, function () {
            scrollCallback.call(self);
        });

        $(window).on('resize.sticky' + this.stickyId, debounce(function () {
            self.stopStick();
            self.adjust();
            scrollCallback.call(self);
        }, 120));

        this.elem.data('bind-sticked', true);

        return this;
    };

    Sticky.prototype.startStick = function () {
        if (!this.sticking) {
            this.sticking = true;
            this.elem.css('visibility', 'hidden');
            this.ghost.insertAfter(this.elem);
            if (this.position.top != undefined) {
                this.ghost.css('margin-top', 'auto');
            }
            this.callback.call(this, true);
        }
        return this;
    };

    Sticky.prototype.stopStick = function () {
        if (this.sticking) {
            this.sticking = false;
            this.elem.css('visibility', 'visible');
            this.ghost = this.ghost.detach();
            this.callback.call(this, false);
        }
        return this;
    };


    function sticky(elem, position, callback) {
        if (!isObject(position)) {
            position = {
                top: int(position)
            }
        }

        if (position.top === undefined && position.bottom === undefined) {
            position.top = 0;
        }
        if (position.left === undefined && position.right === undefined) {
            position.left = 0;
        }

        return (new Sticky({
            element: elem,
            position: position,
            callback: callback
        })).render();

    }

    window.sticky = sticky;

    // sticky.stick(elem, position, callback)
    sticky.stick = sticky;

    // Helper
    // ----------------

    function isObject(obj) {
        return typeof obj === 'object';
    }

    function int(value) {
        return parseInt(value, 10);
    }

    function isPositionStickySupported() {
        if (isIE) {
            return false;
        }

        var isSupported = false,
            document = doc[0],
            body = document.body;

        if (document.createElement && body && body.appendChild && body.removeChild) {

            var elem = document.createElement('div'),
                getStyle = function (styleName) {
                    if (getComputedStyle) {
                        return getComputedStyle(elem).getPropertyValue(styleName);
                    } else {
                        return elem.currentStyle.getAttribute(styleName);
                    }
                };

            body.appendChild(elem);

            for (var i = 0; i < stickyPrefix.length; i++) {
                elem.style.cssText = 'position:' + stickyPrefix[i] + 'sticky; visibility:hidden;';
                if (isSupported = getStyle('position').indexOf('sticky') !== -1) {
                    break;
                }
            }

            elem.parentNode.removeChild(elem);
        }
        return isSupported;
    }

    // https://github.com/jashkenas/underscore/blob/master/underscore.js#L699
    function getTime() {
        return (Date.now || function () {
            return new Date().getTime();
        })()
    }

    function debounce(func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        return function () {
            context = this;
            args = arguments;
            timestamp = getTime();
            var later = function () {
                var last = getTime() - timestamp;
                if (last < wait) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    if (!immediate) result = func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            if (callNow) result = func.apply(context, args);
            return result;
        };
    }

})(this, jQuery);