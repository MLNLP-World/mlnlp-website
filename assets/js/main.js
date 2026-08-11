/**
* Template Name: TheEvent - v4.9.0
* Template URL: https://bootstrapmade.com/theevent-conference-event-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select('#header')
    let offset = header.offsetHeight

    if (!header.classList.contains('header-scrolled')) {
      offset -= 20
    }

    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos - offset,
      behavior: 'smooth'
    })
  }

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      const threshold = document.body.classList.contains('home-page') || document.body.classList.contains('committee-page') || document.body.classList.contains('project-page') || document.body.classList.contains('activity-page') ? 8 : 200
      if (window.scrollY > threshold) {
        selectHeader.classList.add('header-scrolled')
        selectHeader.classList.remove('header-unscrolled')
      } else {
        selectHeader.classList.add('header-unscrolled')
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Mobile nav dropdowns activate
   */
  on('click', '.navbar .dropdown > a', function(e) {
    if (select('#navbar').classList.contains('navbar-mobile')) {
      e.preventDefault()
      this.nextElementSibling.classList.toggle('dropdown-active')
    }
  }, true)

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let navbar = select('#navbar')
      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Gallery Slider
   */
  new Swiper('.gallery-slider', {
    speed: 400,
    loop: true,
    centeredSlides: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20
      },
      575: {
        slidesPerView: 2,
        spaceBetween: 20
      },
      768: {
        slidesPerView: 3,
        spaceBetween: 20
      },
      992: {
        slidesPerView: 5,
        spaceBetween: 30
      }
    }
  });

  /**
   * Initiate gallery lightbox 
   */
  const galleryLightbox = GLightbox({
    selector: '.gallery-lightbox'
  });

  /**
   * Buy tickets select the ticket type on click
   */
  on('show.bs.modal', '#buy-ticket-modal', function(event) {
    select('#buy-ticket-modal #ticket-type').value = event.relatedTarget.getAttribute('data-ticket-type')
  })

  /**
   * Tooltip for truncated content
   */
  const initContentTooltips = () => {
    if (document.querySelector('.mlnlp-content-tooltip')) {
      return
    }

    const tooltip = document.createElement('div')
    tooltip.className = 'mlnlp-content-tooltip'
    tooltip.setAttribute('role', 'tooltip')
    tooltip.setAttribute('aria-hidden', 'true')
    document.body.appendChild(tooltip)

    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let activeTarget = null
    let hideTimer = null

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

    const hideTooltip = () => {
      activeTarget = null
      tooltip.classList.remove('is-visible')
      tooltip.setAttribute('aria-hidden', 'true')
      tooltip.style.visibility = ''
    }

    const positionTooltip = () => {
      if (!activeTarget) {
        return
      }

      const targetRect = activeTarget.getBoundingClientRect()
      const padding = 16
      const gap = 12
      const maxWidth = Math.min(560, window.innerWidth - padding * 2)
      tooltip.style.maxWidth = `${maxWidth}px`
      tooltip.style.left = '0px'
      tooltip.style.top = '0px'
      tooltip.style.visibility = 'hidden'

      const tooltipRect = tooltip.getBoundingClientRect()
      const maxLeft = Math.max(padding, window.innerWidth - padding - tooltipRect.width)
      const maxTop = Math.max(padding, window.innerHeight - padding - tooltipRect.height)

      let left = clamp(targetRect.left, padding, maxLeft)
      let top = targetRect.bottom + gap

      if (top + tooltipRect.height > window.innerHeight - padding) {
        const above = targetRect.top - tooltipRect.height - gap
        top = above >= padding ? above : maxTop
      }

      tooltip.style.left = `${clamp(left, padding, maxLeft)}px`
      tooltip.style.top = `${clamp(top, padding, maxTop)}px`
      tooltip.style.visibility = 'visible'
    }

    const showTooltip = (target) => {
      const content = (target.getAttribute('data-full-content') || '').replace(/\s+/g, ' ').trim()
      if (!content) {
        hideTooltip()
        return
      }

      activeTarget = target
      tooltip.textContent = content
      tooltip.setAttribute('aria-hidden', 'false')
      tooltip.classList.add('is-visible')
      positionTooltip()
    }

    const clearHideTimer = () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer)
        hideTimer = null
      }
    }

    const scheduleHide = () => {
      clearHideTimer()
      hideTimer = window.setTimeout(hideTooltip, 80)
    }

    if (supportsHover) {
      document.addEventListener('pointerover', (event) => {
        const target = event.target.closest('[data-full-content]')
        if (!target) {
          return
        }

        clearHideTimer()
        if (target !== activeTarget) {
          showTooltip(target)
        } else {
          positionTooltip()
        }
      })

      document.addEventListener('pointerout', (event) => {
        const target = event.target.closest('[data-full-content]')
        if (!target || target !== activeTarget) {
          return
        }

        const related = event.relatedTarget
        if (related && target.contains(related)) {
          return
        }

        scheduleHide()
      })
    }

    document.addEventListener('focusin', (event) => {
      const target = event.target.closest('[data-full-content]')
      if (!target) {
        return
      }

      clearHideTimer()
      showTooltip(target)
    })

    document.addEventListener('focusout', (event) => {
      const target = event.target.closest('[data-full-content]')
      if (!target || target !== activeTarget) {
        return
      }

      scheduleHide()
    })

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        clearHideTimer()
        hideTooltip()
      }
    })

    window.addEventListener('scroll', () => {
      if (activeTarget) {
        hideTooltip()
      }
    }, true)

    window.addEventListener('resize', () => {
      if (activeTarget) {
        positionTooltip()
      }
    })

    if (reduceMotion) {
      tooltip.style.transition = 'none'
    }
  }

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    initContentTooltips()
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  });
})()
