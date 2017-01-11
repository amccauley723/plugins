/**
 *
 * Makes a jquery slider of specified ul and lis
 *
 * @author      Andrew J McCauley <amccauley723@gmail.com>
 * @version     1.0
 *
 *
 *
 */
(function($) { // Hide scope, no $ conflict

/* Spotlight manager. */
function Spotlight() {
	this.id = null;
	this.isPaused = false;
	this.curSlide = 0;
	this.swiping = false;
	this.numSlides = 0;
	this.interval;
	this.initialStartX = 0;
	this.initialPos = 0;
	this.touchX = 0;
	this.xChange = 0;
	this.flag = false;
	this.prevSlide = 0;
	this.TOUCH_DEVICE = false;
	this._defaults = {
		start: 0, //Slide to start on
		controls: "", // Container for Controls
		transition: "fade", // Transition Type
		transitionLength: .5, // Time in Seconds to transition
		intervalLength: "5", // Time in Seconds between transitions
		mouseAction: "click", // Mouse Action
		keyboard : true, // Toggle keyboard controls
		swipe : true, // Toggle swiping on mobile
		sensitivity : 30, // how easy it is to swipe, the higher the number the harder it is
		rotate: true, // Toggle to Auto Rotate		
		maxR: "100", // Max Number Per Row	
		slideWidth: null, // Slide Width
		slideHeight: 'auto', //Sets max slide height
		endStop: false, // Toggle to stop at ends
		skipClass : '', //Class to designate slides to skip (not display)
		reachbeginning: null, // function call when hit beginning
		reachending: null, // function call when hit end
		beginning: null, // function call when hit beginning
		ending: null, // function call when hit end
		onSnap: null // function call when slide switches
	},
	
	this.cycleSlides = function() {
		var obj = this;
		this._defaults.rotate = true;
		clearInterval(this.interval);
		this.interval = setInterval(function() {obj.setTrans();obj.nextSlide();}, (this._defaults.intervalLength*1000));
		$("#"+this.id+ " > .slide_buttons > .sl_play").hide();
		$("#"+this.id+ " > .slide_buttons > .sl_pause").show();
		this.isPaused = false;
	},
	
	this.pauseSlides = function () {
		clearInterval(this.interval);
		$("#"+this.id+ " > .slide_buttons > .sl_play").show();
		$("#"+this.id+ " > .slide_buttons > .sl_pause").hide();
		this.isPaused = true;
	},
	
	this.init = function() {
		var obj = this, $this = $("#" + obj.id);
		if(obj._defaults.controls == '') {
			obj._defaults.controls = obj.id;	
		}
		if(obj._defaults.sensitivity >= 30){
			if (navigator.userAgent.match(/android/ig)) {
				 obj._defaults.sensitivity = 15;
			}
		}
		
		if(obj._defaults.skipClass != '') {
			$this.find(".slide_content > ul > li."+obj._defaults.skipClass).each(function() {
				$(this).remove();
			});
			$this.find(".slide_controls > ul > li."+obj._defaults.skipClass).each(function() {
				$(this).remove();
			});
		}
		obj.numSlides = $this.find(".slide_content > ul > li").length;
		
		if(obj._defaults.maxR <= obj.numSlides) {
			obj.numSlides = obj._defaults.maxR;
			for(var i = obj.numSlides-1; i < $("#"+obj.id+ " > .slide_content > ul li").length; i++) {
				$this.find(".slide_content > ul > li").eq(i).remove();
				$this.find(".slide_controls > ul > li").eq(i).remove();
			}
		}
		obj.TOUCH_DEVICE = (typeof document.ontouchstart != "undefined");
		if(obj.TOUCH_DEVICE && obj._defaults.swipe) {
			$this.addClass("slider_container");
			$this.find(".slide_content").addClass("slider_content");
			
			$this.on("touchstart", function(event) {
				obj.removeTrans();
				obj.swiping = false;
				obj.pauseSlides();
				var touchStart = event.originalEvent.touches[0];
				obj.initialStartX = touchStart.clientX;
				obj.touchX = obj.initialStartX;
				obj.initialPos = parseInt($(this).find(".slide_content > ul").css("left"));
				//delete touchStart;
				
				$this.on("touchmove", function(event) {
					if(obj.numSlides > 1) {
						//$("#"+obj.id+ " > .slide_content > ul").addClass("no_trans");
						var touch = event.originalEvent.touches[0];
						obj.touchX = touch.clientX;
						//obj.xChange = obj.initialPos - parseInt($("#" + obj.id+" > .slide_content > ul").css("left"));
						obj.xChange = (obj.initialStartX - obj.touchX);
						if(Math.abs(obj.xChange) > obj._defaults.sensitivity && !obj.swiping) {
							event.preventDefault();
							$(this).find(".slide_content > ul").css("left", obj.initialPos - parseInt(obj.initialStartX-obj.touchX));
							$(this).find(".slide_content > ul > li a").on("click", function() {
								return false;
							});
							obj.swiping = true;
						}
						obj.swiping = false;
						//delete touch;
					}
				});
				$this.on("touchend", function(event) {
					$this.off("touchmove touchend");
					//$("#"+obj.id+ " > .slide_content > ul").removeClass("no_trans");
					if(typeof window['debug'] !== 'undefined'){
						console.log(parseInt(obj.initialStartX-obj.touchX));
					}
					if(parseInt(obj.initialStartX-obj.touchX) > obj._defaults.sensitivity) {
						if(obj.curSlide == obj.numSlides - 1) {
							obj.curSlide--;
						}
						obj.setTrans();
						obj._defaults.rotate = false;
						obj.nextSlide();
					} else if(parseInt(obj.initialStartX-obj.touchX) < -obj._defaults.sensitivity) {
						if(obj.curSlide == 0) {
							obj.curSlide++;
						}
						obj.setTrans();
						obj._defaults.rotate = false;
						obj.previousSlide();
						
					} else {
						obj.removeTrans();
						//snapTo(curSlide);	
					}
					$(this).find(".slide_content > ul > li a").off("click");
					obj.swiping = false;
				});
			});
		}
		$(document).ready(function(e) {
			obj.resizeSpotlight();
        });
		$(window).resize(function() {
			obj.resizeSpotlight();
		});
		this.createSlide();
	},
	
	this.removeTrans = function() {
		$("#"+this.id+ " > .slide_content > ul").css(
			{
				WebkitTransition: 'none',
				MozTransition: 'none',
				MsTransition: 'none',
				transition: 'none'
			}
		);
	},
	
	this.setTrans = function() {
		$("#"+this.id+ " > .slide_content > ul").css(
			{
				WebkitTransition: this._defaults.transitionLength + 's',
				MozTransition: this._defaults.transitionLength + 's',
				MsTransition: this._defaults.transitionLength + 's',
				transition: this._defaults.transitionLength + 's'
			}
		);
	},
	
	this.resizeSpotlight = function() {
		var obj = this, $this = $("#" + this.id);
		obj.removeTrans();
		obj._defaults.slideWidth = $this.find(".slide_content").width();
		$this.find(".slide_content > ul > li").width(obj._defaults.slideWidth);
		$this.find(".slide_content > ul > li > a > img").css('max-height', obj._defaults.slideHeight + 'px');
		$this.find(".slide_content > ul").width(obj._defaults.slideWidth * obj.numSlides);	
		obj.snapTo(obj.curSlide);
		obj.setTrans();

	},
	
	this.createSlide = function() {
		var obj = this, $this = $("#" + this.id), $controls = $("#"+obj._defaults.controls);
		//obj.resizeSpotlight();
		
		var btnWidth = $this.width() / obj.numSlides;
		$controls.find(".slide_controls > ul > li").css("width", ((btnWidth/$this.width()) * 100) + "%");
		
		$this.find(".slide_content > ul > li").each( function(index) {
			$(this).addClass("slideitem"+index);
		});
		$controls.find(".slide_controls > ul > li a").each( function(index) {
			$(this).addClass("slide"+index + " slide_control");
		});
		if(obj._defaults.mouseAction == "hover") {
			$controls.find(".slide_controls > ul > li").mouseover(function () {
				obj.snapTo($controls.find(".slide_controls > ul > li").index(this));
				clearInterval(obj.interval);
				return false;
			});
			$controls.find(".slide_controls > ul > li").mouseout(function (){
				if(obj.isPaused == false) {
					obj.cycleSlides();
				}
			});
		} else {
			$controls.find(".slide_controls > ul > li").bind('click touchstart', function() {
				if(!obj.flag) {
					obj.flag = true;
					obj._defaults.rotate = false;
					obj.snapTo($controls.find(".slide_controls > ul > li").index(this));
					setTimeout(function(){
						obj.flag = false;
					}, 100);
					return false;
					// do something
				}
				
			});
		}
		$(document).keydown(function(event) {
			if(obj._defaults.keyboard) {
				switch (event.keyCode) {
					case 37: obj._defaults.rotate = false; obj.previousSlide(); break;
					case 39: obj._defaults.rotate = false; obj.nextSlide(); break;
				}
			}
		});
		if(obj._defaults.keyboard) {
			$('input').focus(function(){obj._defaults.keyboard = false;});
			$('input').blur(function(){obj._defaults.keyboard = true;});
		}
		if(this._defaults.transition == "slide") {
			$this.find(".slide_content > ul").addClass('slideAnim');
		} else if(this._defaults.transition == "fade") {
			$this.find(".slide_content > ul").css("position", "relative");
			$this.find(".slide_content > ul > li").each( function(index) {
				$this.css("top", "0");
				$this.css("left", "0");
			});
		}

		$this.find(".slide_controls, .slide_buttons").show();

		//spotlight sometimes not showing, about every 5th time, fix for that
		$this.find(".slide_content").css("display", "block");
		$this.find(".spotbackup").hide();
		$this.find(".slide_content > ul").removeClass("no_trans");
		
		$this.find(".slide_content").on('mouseover', function() {
			obj.pauseSlides();
			if(!obj.isPaused) 
				obj.isPaused = false;

		});
		$this.find(".slide_content").on('mouseout', function() {
			if(obj._defaults.rotate) 
				obj.cycleSlides();

			if(!obj.isPaused) 
				obj.isPaused = false;

		});
		if(this._defaults.start > this.numSlides) 
			this._defaults.start = this.numSlides - 1;	
		this.snapTo(this._defaults.start, false);
		if(this._defaults.rotate) 
			this.cycleSlides();
			
		if(typeof this.callback == "function") this.callback(); else {};
	},
	this.previousSlide = function() {
		//this.setTrans();
		if(this.curSlide == 1) {
			if(typeof this._defaults.reachbeginning == "function") {
				this._defaults.reachbeginning(this.instance);
			} 
			this.snapTo(this.curSlide - 1);
		} else if(this.curSlide == 0) {
			if(!this._defaults.endStop){
				if(typeof this._defaults.beginning == "function") {
					this._defaults.beginning(this.instance);
				} else {
					this.snapTo(parseInt(this.numSlides) - 1);
				}
			}
		} else {
			this.snapTo(this.curSlide - 1);
		}
	},
	this.nextSlide = function() {
		//this.setTrans();
		if(this.curSlide == this.numSlides - 2) {
			if(typeof this._defaults.reachending == "function") {
				this._defaults.reachending(this.instance);
			} 
			this.snapTo(parseInt(this.curSlide) + 1);
		} else if(this.curSlide == this.numSlides - 1) {
			if(!this._defaults.endStop){
				if(typeof this._defaults.ending == "function") {
					this._defaults.ending(this.instance);
				} else {
					this.snapTo(0);
				}
			}
		} else {
			this.snapTo(parseInt(this.curSlide) + 1);
		}

	},
	
	this.snapTo = function(num, start) {
		var obj = this, $this = $("#" + this.id), $controls = $("#" + obj._defaults.controls);
		
		obj._defaults.slideWidth = $this.width();
		this.pauseSlides();
		
		$this.find('.slideitem' + obj.curSlide).removeClass('selected');
		$this.find('.slideitem' + num).addClass('selected');
		$controls.find(".slide"+obj.curSlide).removeClass("selected");
		$controls.find(".slide"+num).addClass("selected");
		
		if(obj._defaults.transition == "slide") {
			var nextX = -(this._defaults.slideWidth * num);
			if (/msie/.test(navigator.userAgent.toLowerCase())) {
				$this.find(".slide_content > ul").stop().addClass("no_trans").animate({

					left: nextX
				}, obj._defaults.transitionLength * 1000, function(){
				});
				/*$("#"+obj.id+ " > .slide_content > ul").addClass("no_trans");
				$("#"+obj.id+ " > .slide_content > ul").animate({
					left: nextX
				}, obj._defaults.transitionLength * 1000, function(){
				});*/
			} else {
				obj.setTrans();
				$this.find(".slide_content > ul").css('left', nextX);
			}
		} else if(obj._defaults.transition == "fade") {
			$this.find(".slide_content > ul").removeClass("no_trans").addClass("no_trans");
			//$this.find(".slide_content > ul").addClass("no_trans");
			$this.find(".slide_content > ul > .slideitem"+num).css("display", "inline-block");
			$this.find(".slide_content > ul > li").stop();
			
			$this.find(".slide_content > ul > li.fade_in").fadeTo(obj._defaults.transitionLength * 1000, 0);
			$this.find(".slide_content > ul > .slideitem"+num).fadeTo(obj._defaults.transitionLength * 1000, 1, obj.updateFade(num));
		}
		obj.curSlide = num;
		
		if(this._defaults.rotate) 
			this.cycleSlides();
		if(typeof this._defaults.onSnap == "function" && start !== false && this.curSlide != this.prevSlide ) 
			this._defaults.onSnap(num);
		
		this.prevSlide = this.curSlide;

	},
	
	this.updateFade = function(num) {
		$("#"+this.id+ " > .slide_content > ul > li").addClass("no_trans").css("top", "-1000px");
		$("#"+this.id+ " > .slide_content > ul > .slideitem"+this.curSlide).css("top", "0");
		$("#"+this.id+ " > .slide_content > ul > .slideitem"+num).css("top", "0");
		$("#"+this.id+ " > .slide_content > ul > li").removeClass("no_trans");
		
		$("#"+this.id+ " > .slide_content > ul > li").removeClass("fade_out fade_in");
		$("#"+this.id+ " > .slide_content > ul  >li").addClass("fade_out");
		$("#"+this.id+ " > .slide_content > ul > .slideitem"+num).removeClass("fade_out").addClass("fade_in");
	}
}

$.fn.spotlight = function(options, callback) {
	$.spotlight = new Spotlight(); // singleton instance
	$.spotlight.instance = $(this);
	$.spotlight.id = $(this).attr("id");
	$.spotlight.callback = callback;
	for(prop in options){
		$.spotlight._defaults[prop] = options[prop];
	}
	if($(this).html() != null) {
		$.spotlight.init();
	}
	return $.spotlight;
};
	
})(jQuery);