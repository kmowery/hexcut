
(function($) {
  //$.widget("ui.bitdialog", $.ui.dialog, {
  $.widget("ui.bits", {
    _create: function() {
      var self = $(this);
      var widget = this;
      var element = $(this.element);

      this.makeUpdateCallback = function(span,loc) {
        return function() {
          if(isNaN(widget.n)) { span.text('-'); }
          else {
            span.text(widget.n.testBit(loc) ? "1" : "0");
          }
        };
      };
      this.makeFieldUpdateCallback = function(input,start,end) {
        return function() {
          if(isNaN(widget.n)) { input.val('-'); }
          else {
            var lower = BigInteger("0").setBit(start);
            var width = BigInteger("0").setBit(end-start+1);

            input.val("0x" + widget.n.divide(lower).remainder(width).toString(16));
          }
        };
      };
      this.makeFieldInputCallback = function(bridge) {
        return function(event) {
          try {
            var temp = properParseInt($(this).val());

            if(!isNaN(widget.n)) {
              for(var i = bridge.start; i <= bridge.end; i++) {
                if(temp.testBit(i-bridge.start)) {
                  widget.n = widget.n.setBit(i);
                } else {
                  widget.n = widget.n.clearBit(i);
                }
              }
            }
          } catch (e) {
            // Ignore this update
          }
          widget.updateNumber();
          widget.pushbackNumber();
          return false;
        };
      };
      this.makeMouseEnterCallback = function(loc) {
        return function() {
          $(".bitselected").removeClass("bitselected");
          if(widget.clicked !== null) {
            for(var i = 0; i < widget.bitlength; i++) {
              if( i >= Math.min(widget.clicked, loc) &&
                  i <= Math.max(widget.clicked, loc) ) {
                widget.bits[i].addClass("bitselected");
                widget.ids[i].addClass("bitselected");
              }
            }
          } else {
            widget.bits[loc].addClass("bitselected");
            widget.ids[loc].addClass("bitselected");
          }
        };
      };
      this.makeClickCallback = function(loc) {
        return function() {
          if(widget.clicked === null) {
            widget.clicked = loc;
            widget.bits[loc].addClass("bitselected");
            widget.ids[loc].addClass("bitselected");
          } else {
            if( loc != widget.clicked ) {
              widget.makeBridge(loc, widget.clicked);
              widget.updateState();
            }
            $(".bitselected").removeClass("bitselected");
            widget.clicked = null;
          }
        };
      };
      this.reset = function() {
        element.empty();

        this.header = $('<div>').addClass("header");
        this.fields = $('<div>').addClass("fields");
        this.n = BigInteger("0");
        this.clicked = null;
        this.bitlength = 0;

        this.numberfield = null;
        this.bits = [];
        this.ids = [];
        this.bridges = [];

        this.updates = [];

        element.addClass("widget");
        element.append(this.header);
        element.append(this.fields);

        this.numberfield = $('<input type="text">').val("0x").
          addClass("ui-widget numberfield");
        this.numberfield.bind( 'input', function(event) {
          widget.n = properParseInt(widget.numberfield.val());
          if( !isNaN(widget.n) ) {
            widget.extend(Math.max(widget.bitlength, widget.n.bitLength()));
          }
          widget.updateNumber();
        });
        this.header.append(this.numberfield);
        this.numberfield.focus();

        this.number = $('<div>').addClass("field");
        this.bitfield = $('<div>').addClass("bitfield");
        this.number.append(this.bitfield);
        this.header.append(this.number);

        this.iddiv = $('<div>');
        this.bitfield.append(this.iddiv);
        this.bitdiv = $('<div>').css('display', 'block');
        this.bitfield.append(this.bitdiv);

        this.state = this.makeState();
      };

      // Make the functions
      this.updateNumber = function() {
        for(var v in this.updates) {
          this.updates[v].update();
        }
      };
      // Take whatever this.n is, and put it up into this.numberfield
      this.pushbackNumber = function() {
        base = getBase(this.numberfield.val())[0];
        this.numberfield.val(formatNumber(base, this.n));
      };
      this.makeBridge = function(start, end) {
        if(start == end) {
          return;
        }

        var bridge = $('<div>').addClass("bridge field");
        bridge.deleteBridge = function() {
          // Delete all updates
          for(var i in bridge.bits) {
            removeFromArray(widget.updates,bridge.bits[i]);
          }
          removeFromArray(widget.updates,bridge.hex);
          removeFromArray(widget.bridges,bridge);
          bridge.remove();
          widget.reflowBridges();
          widget.updateState();
        };
        bridge.flow = function() {
          bridge.verticalPosition = 0;
          var reservedSlots = [];
          var place = widget.bridges.indexOf(bridge);
          for(var i = 0; i < place; i++) {
            if(widget.bridges[i].start <= bridge.end &&
                widget.bridges[i].end >= bridge.start) {
              reservedSlots[widget.bridges[i].verticalPosition] = true;
            }
          }
          while(1) {
            if(! (bridge.verticalPosition in reservedSlots)) { break; }
            bridge.verticalPosition += 1;
          }

          bridge.css("right", (bridge.start)+"em");
          bridge.css("right", "+=" + element.css('padding-right'));
          bridge.css("top", widget.header.outerHeight(true) +
              bridge.outerHeight(true) * bridge.verticalPosition);
          bridge.css("top", "+=" + element.css('padding-top'));
          widget.fields.height(Math.max(widget.fields.height(),
                bridge.outerHeight(true) * (bridge.verticalPosition+1)));
          return bridge.verticalPosition;
        };

        bridge.bitfield = $('<div>').addClass("bitfield");
        bridge.start = Math.min(start,end);
        bridge.end = Math.max(start,end);


        for(var i = bridge.end; i >= bridge.start; i-- ) {
          bridge.bits[i] = $('<span>').addClass("bitid");
          bridge.bits[i].update = this.makeUpdateCallback(bridge.bits[i], i);
          widget.updates.push(bridge.bits[i]);
          bridge.bitfield.append(bridge.bits[i]);
        }
        bridge.append(bridge.bitfield);

        bridge.hex = $('<input type="text">').addClass("bridgevalue").
          css('width', (bridge.end-bridge.start) + "em").
          on("input", widget.makeFieldInputCallback(bridge));
        bridge.hex.update = this.makeFieldUpdateCallback(bridge.hex,
            bridge.start, bridge.end);
        widget.updates.push(bridge.hex);
        bridge.append(bridge.hex);

        widget.bridges.push(bridge);
        widget.fields.append(bridge);
        widget.updateNumber();

        bridge.close = $('<a>').addClass("close").click(bridge.deleteBridge);
        bridge.append(bridge.close);
        bridge.on('hover', function(event) {
          if(event.type === "mouseenter") {
            bridge.close.fadeIn();
          } else {
            bridge.close.fadeOut();
          }
        });

        bridge.flow();
      };
      this.extend = function(length) {
        if(this.bitlength > 0) {
          this.ids[this.bitlength-1].removeClass("topleft");
          this.bits[this.bitlength-1].removeClass("bottomleft");
        }
        for(var i = this.bitlength; i < length; i++) {
          this.ids[i] = $('<span>').addClass("bitid").text(i).
            mouseenter(this.makeMouseEnterCallback(i)).
            click(this.makeClickCallback(i));
          this.iddiv.prepend(this.ids[i]);

          this.bits[i] = $('<span>').addClass("bit").
            mouseenter(this.makeMouseEnterCallback(i)).
            click(this.makeClickCallback(i));
          this.bits[i].update = this.makeUpdateCallback(this.bits[i], i);
          this.updates.push(this.bits[i]);
          this.bitdiv.prepend(this.bits[i]);
        }
        this.ids[0].addClass("topright");
        this.bits[0].addClass("bottomright");
        this.ids[length-1].addClass("topleft");
        this.bits[length-1].addClass("bottomleft");

        this.bitlength = length;
        // CSS doesn't provide a way to make this easy in ANY WAY.
        // Ideally, we could just check element's width, but the layout hasn't
        // happened yet. I hate this.
        element.css('margin-left', '-' + (length/2) + 'pc');
        element.css('margin-left', "-=" + element.css('padding-left'));
        element.css('margin-left', "-=" + this.number.css('border-width'));
        element.css('margin-left', "-=" + element.css('border-width'));
      };
      this.makeState = function() {
        // We could use HTML5 pushState here, but it's actually more work:
        //  setting up the webserver, dealing with back button, etc.
        //  Just set location.hash.

        var hash = "";
        hash += "#n=" + this.numberfield.val();
        hash += "&l=" + this.bitlength;
        for(var i in this.bridges) {
          hash += "&b=" + this.bridges[i].start + "," + this.bridges[i].end;
        }
        return hash;
      };
      this.updateState = function() {
        window.location.hash = this.makeState();
      };
      this.setState = function(str) {
        var tokens = str.substr(1).split("&");
        this.reset();
        for(var i in tokens) {
          if(tokens[i].startsWith("n=")) {
            this.numberfield.val(tokens[i].substr(2));
          } else if (tokens[i].startsWith("l=")) {
            this.extend(parseInt(tokens[i].substr(2),10));
          } else if (tokens[i].startsWith("b=")) {
            ends = tokens[i].substr(2).split(",");
            if(ends.length >= 2) {
              this.makeBridge(parseInt(ends[0],10), parseInt(ends[1],10));
            }
          }
        }
        this.updateState();
        this.updateNumber();
      };
      this.reflowBridges = function() {
        var maxheight = 0;
        for(var i in this.bridges) {
          maxheight = Math.max(maxheight,this.bridges[i].flow());
        }
        if(this.bridges.length > 0) {
          widget.fields.height( this.bridges[0].outerHeight(true) *
              (maxheight + 1) );
        } else {
          widget.fields.height(0);
        }
      };
      $(window).on('hashchange', function() {
        var s = widget.makeState();
        var hash = window.location.hash;
        if(hash != s) {
          widget.setState(hash);
        }
      });

      this.reset();

      if(window.location.hash != "#" && window.location.hash !== "") {
        this.setState(window.location.hash.substr(1));
      } else {
        this.extend(32);
        this.updateNumber();
        this.makeBridge(6,4);
        this.makeBridge(2,0);
        this.makeBridge(8,0);

        this.updateState();
      }
    }

  });
})(jQuery);

// JavaScript's parseInt is terrible. parseInt('0xNOTANUMBER') returns 0.
// Fix it and return a BigInteger.
properParseInt = function(str) {
  try {
    result = getBase(str);
    return BigInteger("0"+result[1],result[0]);
  } catch (e) {
    return NaN;
  }
};

formatNumber = function(base, bigint) {
  if(isNaN(bigint)) {
    return "0x";
  }
  if(base == 16) {
    return "0x" + bigint.toString(16);
  } else if(base == 8) {
    return "0" + bigint.toString(16);
  } else if(base == 10) {
    return bigint.toString(10);
  } else {
    throw "Don't know how to format base " + base;
  }
};

// Returns the [base,number_str] given a string
getBase = function(str) {
  if(str.length >= 2 && str.substring(0,2) == '0x') {
    return [16, str.substr(2)];
  } else if(str.length >= 1 && str.substring(0,1) == '0') {
    return [8, str.substr(1)];
  } else {
    return [10, str];
  }
};

// Can't patch this into Array.prototype, otherwise BigInteger fails with some
// horrible error.
removeFromArray = function(array, item) {
  var loc = array.indexOf(item);
  if( loc != -1 ) { array.splice(loc, 1); }
};

// Well, it's JavaScript, get all monkey-patchy
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

$(document).ready(function() {
  $("#help").hide();
  $("#hook").bits();
});

