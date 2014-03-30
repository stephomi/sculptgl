#!/bin/sh

rm -rf sculptgl
mkdir sculptgl
mkdir sculptgl/css
mkdir sculptgl/ressources
mkdir sculptgl/shaders
mkdir sculptgl/lib
java -jar compiler.jar --js=../math3d/camera.js --js=../misc/import.js --js=../misc/export.js --js=../math3d/geometry.js --js=../object/mesh.js --js=../object/background.js --js=../object/octree.js --js=../math3d/picking.js --js=../object/render.js --js=../object/shader.js --js=../editor/sculpt.js --js=../misc/utils.js --js=../object/multimesh.js --js=../editor/subdivision.js --js=../editor/multiresolution.js --js=../object/states.js --js=../gui/gui.js --js=../sculptgl.js --js_output_file=sculptgl/sculptgl.min.js
cp ../lib/*.js sculptgl/lib/
cp ../ressources/*.jpg sculptgl/ressources/
cp ../ressources/*.obj sculptgl/ressources/
cp ../shaders/*.vert sculptgl/shaders/
cp ../shaders/*.frag sculptgl/shaders/
cp ../css/*.css sculptgl/css/
sed "1 a# $(date)" cache.manifest > sculptgl/cache.manifest
cp index-min.html sculptgl/index.html
