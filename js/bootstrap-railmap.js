!function($) {
    "use strict";

    var Railmap = function(element, options) {
        this.init(element, options);
    };

    Railmap.prototype = {
        constructor: Railmap,

        init: function(element, options) {
            this.$element = $(element);
            this.options = $.extend({}, $.fn.railmap.defaults, options);
            this.shouldVisit = this.options.shouldVisit;
            this.current_stop = 1;

            this.setupContent();
            this.calculateWidths();
        },

        setupContent: function() {
            var railmap = this;

            this.removeWhitespaceNodes();

            $('li', this.$element).addClass('railstop muted').prepend($(this.options.stop_template))
                .each(function(index, element) { $(element).data('stop_number', index + 1)})
                .on('click', function(e) {
                    var $element = $(this);
                    if (railmap.shouldVisit($element)) {
                        railmap.go_to($element.data('stop_number'));
                    }
                });
            this.$element.addClass('railmap');

            $('.railstop:first', this.$element)
                .addClass('railstop-first railstop-active').removeClass('muted')
                .parent().before(this.options.rail_template);

            $('.railstop:last', this.$element).addClass('railstop-last');
        },

        removeWhitespaceNodes: function() {
            // Converted from display: table to inline-block for better
            // browser compatibility. However, white space between
            // inline-block elements will be rendered by the browser
            // as a visible space.

            // This removes any whitespace-only text elements
            //     http://stackoverflow.com/a/12480764
            $($('ul', this.$element)[0].childNodes).each(function() {
                $(this).html() || $(this).remove();
            });
        },

        calculateWidths: function () {
            this.inner_width = 100.0 / ($('li', this.$element).length - 1);
            var first_last_width = this.inner_width / 2;

            $('li.railstop', this.$element).width('{0}%'.format(this.inner_width));
            $('li.railstop:first, li.railstop:last', this.$element).width('{0}%'.format(first_last_width));
        },

        _nth_stop: function(stop_number) {
            return $('li.railstop:nth({0})'.format(stop_number - 1), this.$element);
        },

        stopName: function(stop_number) {
            var $element = this._nth_stop(stop_number);
            var name = $element.data("name") || "";
            name = name.replace(/\s+/, '-').toLowerCase();

            return name || stop_number;
        },

        _trigger: function(event_name, target_stop_number) {
            var target_stop = this._nth_stop(target_stop_number);
            var e, _event = function() {
                return $.Event(event_name, {
                    target_stop_number: target_stop_number,
                    target_stop: target_stop
                });
            };

            e = _event();
            this.$element.trigger(e);
            if (e.isDefaultPrevented()) return e;

            event_name = "{0}-to-{1}".format(event_name, this.stopName(target_stop_number));
            e = _event();
            this.$element.trigger(e);

            return e;
        },

        go_to: function (stop_number) {
            if (stop_number < this.current_stop) {
                this.return_to(stop_number);
            } else if (stop_number > this.current_stop) {
                this.advance_to(stop_number);
            }
        },

        advance_to: function(target_stop) {
            var e = this._trigger("advancing", target_stop);

            if (e.isDefaultPrevented()) return;

            this._nth_stop(this.current_stop).removeClass('railstop-active').addClass('railstop-complete');

            this.current_stop = target_stop;

            this.bar().width('{0}%'.format(this.inner_width * (this.current_stop - 1)));
            this._nth_stop(this.current_stop).removeClass('muted').toggleClass('railstop-active');

            this._trigger('advanced', this.current_stop);
        },

        // TODO: advance_to and return_to are nearly identical, refactor
        return_to: function(target_stop) {
            var e = this._trigger("returning", target_stop);

            if (e.isDefaultPrevented()) return;

            this._nth_stop(this.current_stop).removeClass('railstop-active').addClass('railstop-visited');

            this.current_stop = target_stop;

            this.bar().width('{0}%'.format(this.inner_width * (this.current_stop - 1)));
            this._nth_stop(this.current_stop).toggleClass('railstop-active');

            this._trigger('returned', this.current_stop);
        },

        next: function() {
            return this.advance_to(this.current_stop + 1);
        },

        previous: function() {
            return this.return_to(this.current_stop - 1);
        },

        bar: function() {
            return $('.progress > .bar', this.$element);
        }
    };


    // plug-in definition

    var old = $.fn.railmap;

    $.fn.railmap = function(option) {
        return this.each(function() {
            var $this = $(this), data = $this.data('railmap'), options;

            options = typeof option == 'object' && option;

            if (!data) {
                $this.data('railmap', (data = new Railmap(this, options)));
            }

            if (typeof option == 'string') {
                data[option]();
            }
        });
    };

    $.fn.railmap.Constructor = Railmap;

    $.fn.railmap.defaults = {
        rail_template: '<div class="progress"><div class="bar"></div></div>',
        stop_template: '<span class="railstop-icon"></span></br>',

        shouldVisit: function($element) {
            return $element.hasClass('railstop-complete') ||
                $element.hasClass('railstop-visited');
        }
    };

    $.fn.railmap.noConflict = function() {
        $.fn.railmap = old;
        return this;
    };
}(window.jQuery);
