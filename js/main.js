
(function($) {
  //$.widget("ui.bitdialog", $.ui.dialog, {
  $.widget("ui.bits", {
    _create: function() {
      var self = $(this);
      var widget = this;
      var element = $(this.element);

      this.makeUpdateCallback = function(span,loc) {
        return function() {
          console.log("update called for " + loc + " with " + widget.n);
          if(isNaN(widget.n)) { span.text('-'); }
          else { span.text((widget.n >> loc) & 0x1); }
        }
      }
      this.makeFieldUpdateCallback = function(span,start,end) {
        return function() {
          if(isNaN(widget.n)) { span.text('-'); }
          else { span.text( "0x" +
            ((widget.n >> start) & (Math.pow(2,end-start+1)-1)).toString(16)); }
        }
      }

      this.header = $('<div>').addClass("header");
      this.fields = $('<div>').addClass("fields");
      this.n = 0;
      this.clicked = null;

      this.numberfield = null;
      this.bits = [];
      this.ids = [];
      this.bridges = [];

      this.updates = [];

      element.addClass("widget");
      element.append(this.header);
      element.append(this.fields);

      this.numberfield = $('<input type="text">').val("0x")
        .addClass("ui-widget numberfield");
      this.numberfield.bind( 'input', function(event) {
        widget.n = properParseInt(widget.numberfield.val());
        widget.updateNumber();
      });
      this.header.append(this.numberfield);

      this.number = $('<div>').addClass("field");
      this.bitfield = $('<div>').addClass("bitfield");
      this.number.append(this.bitfield);
      this.header.append(this.number);

      var ids = $('<div>');
      for(var i = 31; i >= 0; i--) {
        this.ids[i] = $('<span>').addClass("bitid").text(i).click(function(loc) {
          return function(event) { widget.handleClick(loc); } }(i));
        ids.append(this.ids[i])
      }
      this.bitfield.append(ids);

      var bits = $('<div>').css('display', 'block');
      for(var i = 31; i >= 0; i--) {
        this.bits[i] = $('<span>').addClass("bit").click(function(loc) {
          return function(event) {
            widget.handleClick(loc);
          }
        }(i));
        this.bits[i].update = this.makeUpdateCallback(this.bits[i], i);
        this.updates.push(this.bits[i]);
        bits.append(this.bits[i])
      }
      this.bitfield.append(bits);

      // Make the functions
      this.updateNumber = function() {
        console.log("updateNumber");
        for(var v in this.updates) {
          this.updates[v].update();
        }
      }
      this.handleClick = function(loc) {
        if(this.clicked == null) {
          this.clicked = loc;
          this.bits[loc].addClass("bitselected");
          this.ids[loc].addClass("bitselected");
        } else {
          if( loc != this.clicked ) {
            this.makeBridge(loc, this.clicked);
          }
          this.bits[this.clicked].removeClass("bitselected");
          this.ids[this.clicked].removeClass("bitselected");
          this.clicked = null;
        }
      }
      this.makeBridge = function(start, end) {
        if(start == end) {
          return;
        }

        var bridge = $('<div>').addClass("bridge field");

        bridge.bitfield = $('<div>').addClass("bitfield");
        bridge.start = Math.min(start,end);
        bridge.end = Math.max(start,end);

        bridge.verticalPosition = 0;
        var reservedSlots = [];
        for(var i in widget.bridges) {
          if(widget.bridges[i].start == bridge.start &&
              widget.bridges[i].end == bridge.end) {
            // This is the same bridge. Don't add.
            return;
          }


          if(widget.bridges[i].start <= bridge.end &&
              widget.bridges[i].end >= bridge.start) {
            reservedSlots[widget.bridges[i].verticalPosition] = true;
          }
        }
        while(1) {
          if(! (bridge.verticalPosition in reservedSlots)) {
            break;
          }
          bridge.verticalPosition += 1;
        }

        for(var i = bridge.end; i >= bridge.start; i-- ) {
          bridge.bits[i] = $('<span>').addClass("bitid");
          bridge.bits[i].update = this.makeUpdateCallback(bridge.bits[i], i);
          widget.updates.push(bridge.bits[i]);
          bridge.bitfield.append(bridge.bits[i]);
        }
        bridge.append(bridge.bitfield);

        bridge.hex = $('<span>').addClass("bridgevalue");
        bridge.hex.update = this.makeFieldUpdateCallback(bridge.hex,
            bridge.start, bridge.end);
        widget.updates.push(bridge.hex);
        bridge.append(bridge.hex);

        widget.bridges.push(bridge);
        widget.fields.append(bridge);
        widget.updateNumber();

        bridge.css("position", "absolute");
        bridge.css("left", (32-bridge.end-1)+"em");
        bridge.css("top", widget.header.outerHeight(true) +
            bridge.outerHeight(true) * bridge.verticalPosition);
        widget.fields.height(Math.max(widget.fields.height(),
            bridge.outerHeight(true) * (bridge.verticalPosition+1)));

      }

      this.updateNumber();
    }

  });
})(jQuery);

// JavaScript's parseInt is terrible. parseInt('0xNOTANUMBER') returns 0.
// Fix it.
properParseInt = function(str) {
  var i = 0;
  var base = 10;
  var n = 0;

  if(str.length >= 2 && str.substring(0,2) == '0x') {
    console.log("hex")
    base = 16;
    i = 2;
  } else if(str.length >= 1 && str.substring(0,1) == '0') {
    base = 8;
    i = 1;
  }

  for( ; i < str.length; i++ ) {
    n = n * base + parseInt(str[i], base);
  }

  return n;
}

$(document).ready(function() {
  $("#hook").bits();
});

