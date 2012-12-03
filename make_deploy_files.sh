#!/bin/sh

echo "Compiling less..."
lessc css/main.less > css/main.css

echo "Minifying JS..."
cat js/main.js | jsmin > js/main.min.js 

echo "Generation complete"


