'use strict';

/**
 * SlidePanel
 * Copyright © 2017, D.Nechepurenko <dimanechepurenko@gmail.com>
 * Published under MIT license.
 *
 * Extremely lightweight (>0.1ms execution time (Chrome 61)) scrolling panels
 * with parallax effect like on old Yahoo Weather mobile app
 */

function SlidePanel(options) {
	this.instance = options.inst;
	this.namespace = options.namespace;
	this.slider = this.instance.children[0];

	this.panelsToSlide = options.config.panelsToSlide || 1;
	this.autoPlayEnabled = options.config.autoplay || false;
	this.autoSlideDelay = options.config.autoplaySpeed || 3000;
	this.hasNavigation = options.config.arrows || true;
	this.hasPagination = options.config.dots || true;

	this.windowWidth = 0;
	this.currentPanel = 0;
	this.oldPanel = 0;
	this.initialX = 0;
	this.deltaX = 0;

	this.touchMoveHandler = this.onTouchMove.bind(this);
	this.touchEndHandler = this.onTouchEnd.bind(this);
	this.touchStartHandler = this.onTouchStart.bind(this);
	this.keyDownHandler = this.onKeyDown.bind(this);
	this.drugingHandler = this.onDragStart.bind(this);
	this.disableAutoPlayHandler = this.disableAutoPlay.bind(this);

	this.initConfig();

	if (this.panelsCount > 0) {
		this.initEventListeners();
		this.changePanel();
	}
}

SlidePanel.prototype = {
	initConfig: function () {
		this.panelsList = this.slider.children;
		this.panelsCount = this.panelsList.length - this.panelsToSlide;
		this.moveStep = this.calculateMoveStep();

		if (this.panelsCount > 0) {
			this.initPanels();
			this.initNavigation();
			this.initPagination();
		}
	},

	calculateMoveStep: function () {
		// It could be extended for use absolute values
		return 100 / this.panelsToSlide;
	},

	initPanels: function () {
		for (var i = 0; i < this.panelsCount + 1; i++) {
			var slide = this.panelsList[i];
			slide.setAttribute('tabindex', '0');
		}
	},

	destroyPanels: function () {
		for (var i = 0; i < this.panelsCount + 1; i++) {
			var slide = this.panelsList[i];
			//slide.removeAttribute('role');
			//slide.removeAttribute('id');
			//slide.removeAttribute('aria-describedby');
			//slide.removeAttribute('aria-expanded');
			//slide.removeAttribute('aria-hidden');
			//slide.removeAttribute('tabindex');
			slide.classList.remove('active');
		}
	},

	initPagination: function () {
		if (!this.hasPagination) {
			return;
		}

		var pagination = document.createElement('div');
		pagination.classList.add('slider-pagination');

		for (var i = 0; i < this.panelsCount + 1; i++) {
			var pager = document.createElement('button');
			pager.classList.add('slider-pagination__elem');
			pager.classList.add('slider-pagination__elem_' + i);
			pager.onclick = this.navigateTo.bind(this, i);

			if (i === 0) {
				pager.classList.add('active');
			}

			pagination.appendChild(pager);
		}

		this.pagination = this.instance.insertBefore(pagination, this.instance.firstChild);
		this.paginationList = pagination.getElementsByTagName('button');
	},

	updatePagination: function () {
		if (!this.hasPagination) {
			return;
		}

		var itemsList = this.paginationList;

		itemsList[this.oldPanel].classList.remove('active');
		itemsList[this.currentPanel].classList.add('active');
	},

	initNavigation: function () {
		if (!this.hasNavigation) {
			return;
		}

		var self = this;

		this.arrowPrev = document.createElement('button');
		this.arrowPrev.classList.add('slider-control');
		this.arrowPrev.classList.add('prev');
		this.arrowPrev.setAttribute('aria-label', 'Previous');
		this.arrowPrev.onclick = function () {
			self.navigatePrev();
		};

		this.arrowNext = document.createElement('button');
		this.arrowNext.classList.add('slider-control');
		this.arrowNext.classList.add('next');
		this.arrowNext.setAttribute('aria-label', 'Next');
		this.arrowNext.onclick = function () {
			self.navigateNext();
		};

		this.instance.appendChild(this.arrowPrev);
		this.instance.appendChild(this.arrowNext);
	},

	startAutoPlay: function () {
		if (!this.autoPlayEnabled) {
			return;
		}

		var self = this;

		this.autoPlayTimeout = setTimeout(function () {
			self.navigateInfinite();
		}, self.autoSlideDelay);
		this.slider.classList.add('autoslide');
	},

	stopAutoPlay: function () {
		window.clearTimeout(this.autoPlayTimeout);
		this.slider.classList.remove('autoslide');
	},

	disableAutoPlay: function () {
		this.stopAutoPlay();
		this.autoPlayEnabled = false;

		this.instance.removeEventListener('keydown', this.disableAutoPlayHandler);
		this.instance.removeEventListener('mousedown', this.disableAutoPlayHandler);
		this.instance.removeEventListener('touchstart', this.disableAutoPlayHandler);
	},

	animateTouch: function () {
		this.slider.style.transform = 'translate3d(' + (-(this.currentPanel * this.moveStep) - this.deltaX) + '%,0,0)';
	},

	animateChange: function () {
		return this.slider.style.transform = 'translate3d(' + -this.currentPanel * this.moveStep + '%,0,0)';
	},

	animateBounds: function (isNext) {
		var self = this;
		var swipeDistance = 120;

		this.initialX = 0;
		this.deltaX = 0;
		this.windowWidth = window.innerWidth;

		var transitionEndHandler = function () {
			self.slider.removeEventListener('transitionend', transitionEndHandler);
			self.slider.classList.remove('animating-bounds');
			self.changePanel();
		};

		this.slider.addEventListener('transitionend', transitionEndHandler);
		this.slider.classList.add('animating-bounds');

		this.onTouchMove({
			clientX: isNext ? -swipeDistance : swipeDistance
		});
	},

	changePanel: function () {
		this.stopAutoPlay();
		this.updatePagination();

		window.requestAnimationFrame(this.animateChange.bind(this));

		this.startAutoPlay();
	},

	navigatePrev: function (isTouch) {
		if (this.currentPanel > 0) {
			this.oldPanel = this.currentPanel;
			this.currentPanel--;
			this.changePanel();
		} else {
			if (isTouch) {
				this.changePanel();
			} else {
				this.animateBounds();
			}
		}
	},

	navigateNext: function (isTouch) {
		if (this.currentPanel < this.panelsCount) {
			this.oldPanel = this.currentPanel;
			this.currentPanel++;
			this.changePanel();
		} else {
			if (isTouch) {
				this.changePanel();
			} else {
				this.animateBounds(true);
			}
		}
	},

	navigateTo: function (index) {
		// Used by pagination
		if (index < this.panelsCount || index > 0) {
			this.oldPanel = this.currentPanel;
			this.currentPanel = index;
			this.changePanel();
		}
	},

	navigateInfinite: function () {
		// Used by autoplay
		this.oldPanel = this.currentPanel;
		this.currentPanel++;

		if (this.currentPanel > this.panelsCount) {
			this.currentPanel = 0;
		}

		this.changePanel();
	},

	onTouchMove: function (event) {
		var x = event.touches !== undefined ? event.touches[0].pageX : event.clientX;

		this.deltaX = (this.initialX - x) / this.windowWidth * 70;

		if ((this.currentPanel === 0 && this.deltaX < 0) ||
			(this.currentPanel === this.panelsCount && this.deltaX > 0)) {
			this.deltaX /= 2
		}

		window.requestAnimationFrame(this.animateTouch.bind(this));
	},

	onTouchStart: function (event) {
		this.initialX = event.pageX || event.touches[0].pageX;
		this.windowWidth = window.innerWidth;
		this.deltaX = 0;

		this.stopAutoPlay();

		this.slider.addEventListener('mousemove', this.touchMoveHandler);
		this.slider.addEventListener('touchmove', this.touchMoveHandler);
		this.slider.addEventListener('mouseleave', this.touchEndHandler);
		this.slider.classList.add('grabbing');
	},

	onTouchEnd: function () {
		this.slider.removeEventListener('mousemove', this.touchMoveHandler);
		this.slider.removeEventListener('touchmove', this.touchMoveHandler);
		this.slider.removeEventListener('mouseleave', this.touchEndHandler);
		this.slider.classList.remove('grabbing');

		if (this.deltaX <= -8) {
			this.navigatePrev(true);
		}

		if (this.deltaX >= 8) {
			this.navigateNext(true);
		}

		if (this.deltaX > -8 && this.deltaX < 8) {
			this.changePanel();
		}

		this.deltaX = 0;
	},

	onKeyDown: function (event) {
		switch (event.key) {
			case 'ArrowRight':
				return this.navigateNext();
			case 'ArrowLeft':
				return this.navigatePrev();
		}
	},

	onDragStart: function (event) {
		event.preventDefault();
	},

	initEventListeners: function () {
		this.slider.addEventListener('mousedown', this.touchStartHandler);
		this.slider.addEventListener('touchstart', this.touchStartHandler, { passive: true });

		this.slider.addEventListener('mouseup', this.touchEndHandler);
		this.slider.addEventListener('touchend', this.touchEndHandler, { passive: true });

		this.instance.addEventListener('keydown', this.keyDownHandler);
		this.instance.addEventListener('dragstart', this.drugingHandler);

		this.instance.addEventListener('keydown', this.disableAutoPlayHandler);
		this.instance.addEventListener('mousedown', this.disableAutoPlayHandler);
		this.instance.addEventListener('touchstart', this.disableAutoPlayHandler, { passive: true });
	},

	destroy: function () {
		this.slider.removeAttribute('style');
		this.destroyPanels();
		this.pagination.parentElement.removeChild(this.pagination);
		this.arrowPrev.parentElement.removeChild(this.arrowPrev);
		this.arrowNext.parentElement.removeChild(this.arrowNext);

		this.slider.removeEventListener('mousedown', this.touchStartHandler);
		this.slider.removeEventListener('touchstart', this.touchStartHandler);

		this.slider.removeEventListener('mouseup', this.touchEndHandler);
		this.slider.removeEventListener('touchend', this.touchEndHandler);

		this.instance.removeEventListener('keydown', this.keyDownHandler);
		this.instance.removeEventListener('dragstart', this.drugingHandler);
	}
};

// Parallax like effect

function ParallaxSlider(options) {
	SlidePanel.call(this, options);
	this.layersList = options.config.layersList;
	this.layerShift = 4;
	this.initLayerPosition();
}

ParallaxSlider.prototype = Object.create(SlidePanel.prototype);
ParallaxSlider.prototype.constructor = ParallaxSlider;

ParallaxSlider.prototype.initLayerPosition = function () {
	for (var layer = 0; layer < this.layersList.length; layer++) {
		this.layersList[layer].style.left = '-' + layer * (100 / this.layerShift) + '%';
	}

	for (var panel = 0; panel < this.panelsList.length; panel++) {
		this.panelsList[panel].style.left = panel * 100 + '%';
	}
};

ParallaxSlider.prototype.animateTouch = function () {
	this.slider.style.transform = 'translate3d(' + (-this.currentPanel * this.moveStep - this.deltaX) + '%,0,0)';

	for (var layer = 0; layer < this.layersList.length; layer++) {
		this.layersList[layer].style.transform =
			'translate3d(' + (this.currentPanel * (this.moveStep / this.layerShift) + this.deltaX / this.layerShift) + '%,0,0)';
	}
};

ParallaxSlider.prototype.animateChange = function () {
	this.slider.style.transform = 'translate3d(' + -this.currentPanel * this.moveStep + '%,0,0)';

	for (var layer = 0; layer < this.layersList.length; layer++) {
		this.layersList[layer].style.transform =
			'translate3d(' + this.currentPanel * (this.moveStep / this.layerShift) + '%,0,0)';
	}
};

// Flip like effect

function FlipSlider(options) {
	SlidePanel.call(this, options);
	this.layersList = options.config.layersList;
	this.layerShift = 2;
	this.initLayerPosition();
}

FlipSlider.prototype = Object.create(SlidePanel.prototype);
FlipSlider.prototype.constructor = FlipSlider;

FlipSlider.prototype.initLayerPosition = function () {
	for (var layer = 0; layer < this.layersList.length; layer++) {
		this.layersList[layer].style.left = '-' + layer * (100 / this.layerShift) + '%';
	}

	for (var panel = 0; panel < this.panelsList.length; panel++) {
		this.panelsList[panel].style.left = panel * 100 + '%';
	}
};

FlipSlider.prototype.animateTouch = function () {
	this.slider.style.transform = 'translate3d(' + (-this.currentPanel * this.moveStep - this.deltaX) + '%,0,0)';

	for (var layer = 0; layer < this.layersList.length; layer++) {
		this.layersList[layer].style.transform =
			'translate3d(' + (this.currentPanel * (this.moveStep / 2) + this.deltaX / 2) + '%,0,0)';
	}
};

FlipSlider.prototype.animateChange = function () {
	this.slider.style.transform = 'translate3d(' + -this.currentPanel * this.moveStep + '%,0,0)';

	for (var layer = 0; layer < this.layersList.length; layer++) {
		this.layersList[layer].style.transform =
			'translate3d(' + this.currentPanel * (this.moveStep / 2) + '%,0,0)';
	}
};

// Carousel

function Carousel(options) {
	SlidePanel.call(this, options);
}

Carousel.prototype = Object.create(SlidePanel.prototype);
Carousel.prototype.constructor = Carousel;

Carousel.prototype.animateTouch = function () {
	this.slider.style.transform = 'translate3d(' + (-this.currentPanel * this.moveStep - this.deltaX) + '%,0,0)';
};

Carousel.prototype.animateChange = function () {
	this.slider.style.transform = 'translate3d(' + -this.currentPanel * this.moveStep + '%,0,0)';
};

// Carousel with slice effect

function CarouselSliced(options) {
	SlidePanel.call(this, options);
	this.layersList = options.config.layersList;
}

CarouselSliced.prototype = Object.create(SlidePanel.prototype);
CarouselSliced.prototype.constructor = CarouselSliced;

CarouselSliced.prototype.animateTouch = function () {
	this.slider.style.transform = 'translate3d(' + (-this.currentPanel * this.moveStep - this.deltaX) + '%,0,0)';

	for (var bg = 0; bg < this.layersList.length; bg++) {
		if (bg < this.currentPanel + this.panelsToSlide && bg >= this.currentPanel) {
			this.layersList[bg].style.transform = 'translate3d(' + (this.deltaX / 6) * bg + '%,0,0)';
		} else {
			this.layersList[bg].style.transform = 'translate3d(' + (this.deltaX * 4) + '%,0,0)';
		}
	}
};

CarouselSliced.prototype.animateChange = function () {
	this.slider.style.transform = 'translate3d(' + -this.currentPanel * this.moveStep + '%,0,0)';

	for (var bg = 0; bg < this.layersList.length; bg++) {
		this.layersList[bg].style.transform = 'translate3d(0,0,0)';
	}
};

function initSliders() {
	var sliders = document.querySelectorAll('[data-sliding-panel]');

	for (var slider = 0; slider < sliders.length; slider++) {
		var inst = sliders[slider];

		switch (true) {
			case inst.hasAttribute('data-slider-parallax'):
				new ParallaxSlider({
					inst: inst,
					namespace: slider,
					config: {
						autoplay: false,
						autoplaySpeed: 3000,
						arrows: true,
						dots: true,
						panelsToSlide: 1,
						layersList: inst.querySelectorAll('.slide__bg')
					}
				});
				break;
			case inst.hasAttribute('data-slider-flip'):
				new FlipSlider({
					inst: inst,
					namespace: slider,
					config: {
						autoplay: false,
						autoplaySpeed: 3000,
						arrows: true,
						dots: true,
						panelsToSlide: 1,
						layersList: inst.querySelectorAll('.gallery__img')
					}
				});
				break;
			case inst.hasAttribute('data-carousel'):
				new Carousel({
					inst: inst,
					namespace: slider,
					config: {
						autoplay: false,
						autoplaySpeed: 3000,
						arrows: true,
						dots: false,
						panelsToSlide: 4,
					}
				});
				break;
			case inst.hasAttribute('data-carousel-sliced'):
				new CarouselSliced({
					inst: inst,
					namespace: slider,
					config: {
						autoplay: false,
						autoplaySpeed: 3000,
						arrows: true,
						dots: false,
						panelsToSlide: 4,
						layersList: inst.querySelectorAll('.box')
					}
				});
				break;
		}
	}
}

initSliders();
