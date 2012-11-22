
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

      this.header = $('<div>');
      this.n = 0;
      this.clicked = null;

      this.numberfield = null;
      this.bits = [];
      this.bridges = [];

      this.updates = [];

      element.addClass("bits");
      element.append(this.header);

      this.numberfield = $('<input type="text">').val("0x").addClass("ui-widget numberfield");
      this.numberfield.bind( 'input', function(event) {
        widget.n = properParseInt(widget.numberfield.val());
        widget.updateNumber();
      });
      this.header.append(this.numberfield);

      this.bitfield = $('<div>').addClass("bitfield");
      this.header.append(this.bitfield);

      var ids = $('<div>').css('display', 'block');
      for(var i = 31; i >= 0; i--) {
        var id = $('<span>').addClass("bitid").text(i);
        ids.append(id)
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

        var bitfield = $('<div>').addClass("bitfield");
        bitfield.start = Math.min(start,end);
        bitfield.end = Math.max(start,end);

        bitfield.verticalPosition = 0;
        var reservedSlots = [];
        for(var i in widget.bridges) {
          if(widget.bridges[i].start == bitfield.start &&
              widget.bridges[i].end == bitfield.end) {
            // This is the same bridge. Don't add.
            return;
          }


          if(widget.bridges[i].start <= bitfield.end &&
              widget.bridges[i].end >= bitfield.start) {
            reservedSlots[widget.bridges[i].verticalPosition] = true;
          }
        }
        while(1) {
          if(! (bitfield.verticalPosition in reservedSlots)) {
            break;
          }
          bitfield.verticalPosition += 1;
        }


        for(var i = bitfield.end; i >= bitfield.start; i-- ) {
          bitfield.bits[i] = $('<span>').addClass("bit");
          bitfield.bits[i].update = this.makeUpdateCallback(bitfield.bits[i], i);
          widget.updates.push(bitfield.bits[i]);
          bitfield.append(bitfield.bits[i]);
        }

        widget.bridges.push(bitfield);
        element.append(bitfield);
        widget.updateNumber();

        bitfield.css("position", "absolute");
        bitfield.css("left", (32-bitfield.end-1)+"em");
        bitfield.css("top", widget.header.height() +
            bitfield.height() * bitfield.verticalPosition);
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

