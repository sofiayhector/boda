(function () {
    'use strict';

    $(window).on('load', function () {
        $('.loader').delay(600).fadeOut('slow');
        setTimeout(function () {
            $('.cover .display-tc').addClass('fade-in-up');
            // the record peeks out of the LP sleeve and starts hopping
            $('.lp').addClass('is-ready');
        }, 800);
    });

    // Side navigation pill
    document.addEventListener('DOMContentLoaded', function () {
        const sideNav = document.getElementById('side-nav');
        if (!sideNav) {
            return;
        }
        const toggle = sideNav.querySelector('.side-nav__toggle');
        const toggleIcon = toggle.querySelector('i');
        const moreToggle = sideNav.querySelector('.side-nav__more-toggle');

        const setMore = function (open) {
            sideNav.classList.toggle('is-more-open', open);
            moreToggle.setAttribute('aria-expanded', open);
        };

        // menu panel (phones and tablets); on desktop the pill is always visible
        const setOpen = function (open) {
            sideNav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', open);
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            toggleIcon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
            if (!open) {
                setMore(false);
            }
        };

        toggle.addEventListener('click', function () {
            setOpen(!sideNav.classList.contains('is-open'));
        });

        moreToggle.addEventListener('click', function () {
            setMore(!sideNav.classList.contains('is-more-open'));
        });

        // close after choosing a link
        sideNav.addEventListener('click', function (e) {
            if (e.target.closest('a')) {
                setOpen(false);
            }
        });

        document.addEventListener('click', function (e) {
            if (!sideNav.contains(e.target)) {
                setOpen(false);
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sideNav.classList.contains('is-open')) {
                setOpen(false);
                toggle.focus();
            } else if (e.key === 'Escape') {
                setMore(false);
            }
        });

        // hide the menu while the "Save the date" cover is on screen (home page only)
        const cover = document.querySelector('#header.cover');
        if (cover && 'IntersectionObserver' in window) {
            // the root is the bottom half of the viewport, so the cover counts as
            // "on screen" until its bottom edge scrolls above the middle
            const observer = new IntersectionObserver(
                function (entries) {
                    const onCover = entries[0].isIntersecting;
                    sideNav.classList.toggle('is-hidden', onCover);
                    if (onCover) {
                        setOpen(false);
                    }
                },
                { rootMargin: '-50% 0px 0px 0px' }
            );
            observer.observe(cover);
        }
    });

    // LP cover: the page stays locked until the record is opened (click/tap). Then the
    // sleeve slides off to the left and the record off to the right; the record comes back
    // tucked into the bottom right corner as the menu, and the cover collapses so the page
    // card slides up.
    var lpHero = function () {
        var hero = document.querySelector('.lp-hero');
        if (!hero) {
            return;
        }
        var root = document.documentElement;
        var lp = hero.querySelector('.lp');
        var vinyl = lp.querySelector('.lp__vinyl');
        var openBtn = lp.querySelector('.lp__open');
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var opened = false;

        // no scrolling until the record is opened
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        root.classList.add('lp-locked');
        window.scrollTo({ top: 0, behavior: 'instant' });

        // no zooming either (pinch / double tap) until it's opened: touch-action: none in the
        // CSS covers Android, and these gesture / two-finger touch handlers cover iOS. (The
        // viewport meta is left alone: changing it makes iOS re-lay out the whole screen.)
        var blockWhileLocked = function (e) {
            if (root.classList.contains('lp-locked')) {
                e.preventDefault();
            }
        };
        document.addEventListener('gesturestart', blockWhileLocked);
        document.addEventListener('gesturechange', blockWhileLocked);
        document.addEventListener(
            'touchmove',
            function (e) {
                if (e.touches.length > 1) {
                    blockWhileLocked(e);
                }
            },
            { passive: false }
        );

        var slideOut = null;

        var dock = function () {
            if (slideOut) {
                slideOut.cancel();
            }
            // the record leaves the cover for <body>, so no browser keeps it inside the
            // collapsed cover's layer (iOS Safari drew it under the page card)
            document.body.appendChild(vinyl);
            vinyl.classList.add('is-docked');
            hero.classList.add('is-collapsed');
        };

        var unlock = function () {
            root.classList.remove('lp-locked');
        };

        // instant: skip the animation (e.g. arriving from another page with a #section link)
        var openRecord = function (instant) {
            if (opened) {
                return;
            }
            opened = true;
            openBtn.setAttribute('aria-expanded', 'true');
            if (instant || reduceMotion) {
                hero.classList.add('is-instant');
                lp.classList.add('is-ready', 'is-open');
                hero.classList.add('is-open');
                dock();
                unlock();
                return;
            }
            // where the record is right now (mid-hop), so the slide starts there
            var from = getComputedStyle(vinyl).transform;
            lp.classList.add('is-ready', 'is-open');
            hero.classList.add('is-open');
            if (vinyl.animate) {
                slideOut = vinyl.animate(
                    [{ transform: from === 'none' ? 'translateX(0)' : from }, { transform: 'translateX(110vw)' }],
                    { duration: 1200, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' }
                );
            }
            // once the record has slid out of the sleeve and both have left the screen
            // (record 1.2s, sleeve 0.45s delay + 1s): the record comes back in the corner
            // and the card slides up
            setTimeout(function () {
                dock();
                setTimeout(unlock, 900);
            }, 1450);
        };

        openBtn.addEventListener('click', function () {
            openRecord(false);
        });

        // menu links on the docked record scroll smoothly to their section
        lp.querySelectorAll('.lp__nav a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var section = document.querySelector(link.getAttribute('href'));
                if (section) {
                    e.preventDefault();
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // links like index.html#events from other pages: open right away and go there
        if (location.hash) {
            var target = document.querySelector(location.hash);
            if (target && !hero.contains(target)) {
                openRecord(true);
                var goToTarget = function () {
                    target.scrollIntoView({ behavior: 'instant' });
                };
                goToTarget();
                // again once images have loaded and the layout is final
                window.addEventListener('load', goToTarget);
            }
        }
    };

    // RSVP: the confirm button opens WhatsApp with the number and message set in its
    // data-phone / data-message attributes (no form, no server)
    var whatsappRsvp = function () {
        document.querySelectorAll('.rsvp-whatsapp__button').forEach(function (button) {
            var phone = (button.getAttribute('data-phone') || '').replace(/\D/g, '');
            var message = button.getAttribute('data-message') || '';
            button.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
        });
    };

    // Gift registry: "Copiar CLABE" copies the digits of the element named in
    // data-copy-target and shows "¡Copiada!" on the button for 2s
    var copyClabe = function () {
        var copyText = function (text) {
            if (navigator.clipboard && window.isSecureContext) {
                return navigator.clipboard.writeText(text);
            }
            // fallback for older browsers / plain http: a hidden textarea + execCommand
            return new Promise(function (resolve, reject) {
                var area = document.createElement('textarea');
                area.value = text;
                area.setAttribute('readonly', '');
                area.style.position = 'fixed';
                area.style.top = '-1000px';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.select();
                area.setSelectionRange(0, text.length);
                var ok = false;
                try {
                    ok = document.execCommand('copy');
                } catch (e) {
                    ok = false;
                }
                document.body.removeChild(area);
                if (ok) {
                    resolve();
                } else {
                    reject();
                }
            });
        };

        document.querySelectorAll('.gift-copy').forEach(function (button) {
            var target = document.querySelector(button.getAttribute('data-copy-target'));
            var label = button.querySelector('.gift-btn__label, .btn-sand__label');
            var icon = button.querySelector('i');
            var status = button.parentNode.querySelector('[data-copy-status]');
            if (!target || !label) {
                return;
            }
            var original = label.textContent;
            var timer;

            var feedback = function (text, copied) {
                label.textContent = text;
                if (status) {
                    status.textContent = text;
                }
                button.classList.toggle('is-copied', copied);
                if (icon) {
                    icon.className = copied ? 'fa-solid fa-check' : 'fa-solid fa-copy';
                }
                clearTimeout(timer);
                timer = setTimeout(function () {
                    label.textContent = original;
                    button.classList.remove('is-copied');
                    if (icon) {
                        icon.className = 'fa-solid fa-copy';
                    }
                }, 2000);
            };

            button.addEventListener('click', function () {
                var digits = target.textContent.replace(/\D/g, '');
                copyText(digits).then(
                    function () {
                        feedback('¡Copiada!', true);
                    },
                    function () {
                        // could not copy: select the number so it can be copied by hand
                        var range = document.createRange();
                        range.selectNodeContents(target);
                        var selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                        feedback('Cópiala a mano', false);
                    }
                );
            });
        });
    };

    // Content way point
    var contentWayPoint = function () {
        var i = 0;
        $('.animate-box').waypoint(
            function (direction) {
                if (
                    direction === 'down' &&
                    !$(this.element).hasClass('animated-fast')
                ) {
                    i++;
                    $(this.element).addClass('item-animate');
                    setTimeout(function () {
                        $('body .animate-box.item-animate').each(function (k) {
                            var el = $(this);
                            setTimeout(
                                function () {
                                    var effect = el.data('animate-effect');
                                    if (effect === 'fade-in') {
                                        el.addClass('fade-in animated-fast');
                                    } else if (effect === 'fade-in-left') {
                                        el.addClass(
                                            'fade-in-left animated-fast'
                                        );
                                    } else if (effect === 'fade-in-right') {
                                        el.addClass(
                                            'fade-in-right animated-fast'
                                        );
                                    } else {
                                        el.addClass('fade-in-up animated-fast');
                                    }
                                    el.removeClass('item-animate');
                                },
                                k * 200,
                                'easeInOutExpo'
                            );
                        });
                    }, 100);
                }
            },
            { offset: '85%' }
        );
    };

    // Testimonials
    var testimonialCarousel = function () {
        var owl = $('.owl-carousel-fullwidth');
        owl.owlCarousel({
            items: 1,
            loop: true,
            margin: 0,
            responsiveClass: true,
            nav: false,
            dots: true,
            smartSpeed: 800,
            autoHeight: true,
        });
    };

    // Counter
    var counter = function () {
        $('.js-counter').countTo({
            formatter: function (value, options) {
                return value.toFixed(options.decimals);
            },
        });
    };

    var counterWayPoint = function () {
        if ($('#counter').length > 0) {
            $('#counter').waypoint(
                function (direction) {
                    if (
                        direction === 'down' &&
                        !$(this.element).hasClass('animated')
                    ) {
                        setTimeout(counter, 400);
                        $(this.element).addClass('animated');
                    }
                },
                { offset: '90%' }
            );
        }
    };

    // Countdown
    var countdown = function () {
        var countdown = document.querySelector('.countdown');

        function getTimeRemaining(endtime) {
            var t = Date.parse(endtime) - Date.parse(new Date());
            var seconds = Math.floor((t / 1000) % 60);
            var minutes = Math.floor((t / 1000 / 60) % 60);
            var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
            var days = Math.floor(t / (1000 * 60 * 60 * 24));
            return {
                total: t,
                days: days,
                hours: hours,
                minutes: minutes,
                seconds: seconds,
            };
        }

        function initializeClock(id, endtime) {
            var clock = document.getElementById(id);
            var daysSpan = clock.querySelector('.days');
            var hoursSpan = clock.querySelector('.hours');
            var minutesSpan = clock.querySelector('.minutes');
            var secondsSpan = clock.querySelector('.seconds');
            var newChild;

            function updateClock() {
                var t = getTimeRemaining(endtime);
                var daysArr = String(t.days).split('');
                daysSpan.innerHTML = '';
                for (var i = 0; i < daysArr.length; i++) {
                    newChild = document.createElement('span');
                    newChild.innerHTML = daysArr[i];
                    daysSpan.appendChild(newChild);
                }
                var hoursArr = String(('0' + t.hours).slice(-2)).split('');
                hoursSpan.innerHTML = '';
                for (var i = 0; i < hoursArr.length; i++) {
                    newChild = document.createElement('span');
                    newChild.innerHTML = hoursArr[i];
                    hoursSpan.appendChild(newChild);
                }
                var minuteArr = String(('0' + t.minutes).slice(-2)).split('');
                minutesSpan.innerHTML = '';
                for (var i = 0; i < minuteArr.length; i++) {
                    newChild = document.createElement('span');
                    newChild.innerHTML = minuteArr[i];
                    minutesSpan.appendChild(newChild);
                }
                var secondArr = String(('0' + t.seconds).slice(-2)).split('');
                secondsSpan.innerHTML = '';
                for (var i = 0; i < secondArr.length; i++) {
                    newChild = document.createElement('span');
                    newChild.innerHTML = secondArr[i];
                    secondsSpan.appendChild(newChild);
                }
                if (t.total <= 0) {
                    clearInterval(timeinterval);
                }
            }
            updateClock();
            var timeinterval = setInterval(updateClock, 1000);
        }
        // set your wedding date here
        var deadline = '2027-02-27T17:30:00';
        if (countdown) {
            initializeClock('timer', deadline);
        }
    };

    var isotope = function () {
        var $container = $('.grid');

        $container.imagesLoaded(function () {
            $container.isotope({
                // options
                itemSelector: '.grid-item',
                percentPosition: true,
                masonry: {
                    // use element for option
                    columnWidth: '.grid-sizer',
                },
                getSortData: {
                    moments: '.moments', // text from querySelector
                    category: '[data-category]',
                    weight: function (itemElem) {
                        // function
                        var weight = $(itemElem).find('.weight').text();
                        return parseFloat(weight.replace(/[\(\)]/g, ''));
                    },
                },
            });
        });

        // filter functions
        var filterFns = {
            // show if number is greater than 50
            numberGreaterThan50: function () {
                var number = $(this).find('.number').text();
                return parseInt(number, 10) > 50;
            },
            // show if name ends with -ium
            ium: function () {
                var name = $(this).find('.name').text();
                return name.match(/ium$/);
            },
        };
        // bind filter button click
        $('.filters-button-group').on('click', 'button', function () {
            var filterValue = $(this).attr('data-filter');
            // use filterFn if matches value
            filterValue = filterFns[filterValue] || filterValue;
            $container.isotope({ filter: filterValue });
        });
        // change is-checked class on buttons
        $('.button-group').each(function (i, buttonGroup) {
            var $buttonGroup = $(buttonGroup);
            $buttonGroup.on('click', 'button', function () {
                $buttonGroup.find('.is-checked').removeClass('is-checked');
                $(this).addClass('is-checked');
            });
        });
    };

    $(function () {
        lpHero();
        contentWayPoint();
        testimonialCarousel();
        counter();
        counterWayPoint();
        countdown();
        isotope();
        whatsappRsvp();
        copyClabe();
    });
})();
