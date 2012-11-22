
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

      this.n = 0;
      this.clicked = null;

      this.numberfield = null;
      this.bits = [];
      this.bridges = [];

      this.updates = [];

      element.addClass("bits");
      this.numberfield = $('<input type="text">').val("0x").addClass("ui-widget numberfield");
      this.numberfield.bind( 'input', function(event) {
        widget.n = properParseInt(widget.numberfield.val());
        widget.updateNumber();
      });
      element.append(this.numberfield);

      this.bitfield = $('<div>').addClass("bitfield");
      element.append(this.bitfield);

      for(var i = 31; i >= 0; i--) {
        this.bits[i] = $('<span>').addClass("bit").click(function(loc) {
          return function(event) {
            widget.handleClick(loc);
          }
        }(i));
        this.bits[i].update = this.makeUpdateCallback(this.bits[i], i);
        this.updates.push(this.bits[i]);
        this.bitfield.append(this.bits[i])
      }

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
        } else {
          if( loc != this.clicked ) {
            this.makeBridge(loc, this.clicked);
          }
          this.bits[this.clicked].removeClass("bitselected");
          this.clicked = null;
        }
      }
      this.makeBridge = function(start, end) {
        if(start == end) {
          return;
        }
        // TODO: check that this bridge doesn't exist
        var bitfield = $('<div>').addClass("bitfield");
        bitfield.start = Math.min(start,end);
        bitfield.end = Math.max(start,end);

        for(var i = bitfield.end - bitfield.start; i >= 0; i-- ) {
          bitfield.bits[i] = $('<span>').addClass("bit");
          bitfield.bits[i].update = this.makeUpdateCallback(bitfield.bits[i],
              i+bitfield.start);
          widget.updates.push(bitfield.bits[i]);
          bitfield.append(bitfield.bits[i]);
        }
        bitfield.css("margin-left", (32-bitfield.end-1)+"em");
        widget.bridges.push(bitfield);
        element.append(bitfield);
        widget.updateNumber();
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

