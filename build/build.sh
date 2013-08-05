rm -rf sculptgl
mkdir sculptgl
mkdir sculptgl/css
mkdir sculptgl/ressources
mkdir sculptgl/shaders
mkdir sculptgl/lib
java -jar compiler.jar --js=../object/aabb.js --js=../math3d/camera.js --js=../misc/files.js --js=../math3d/geometry.js --js=../math3d/grid.js --js=../object/mesh.js --js=../object/octree.js --js=../math3d/picking.js --js=../object/render.js --js=../editor/sculpt.js --js=../misc/utils.js --js=../editor/topology.js --js=../editor/subdivision.js --js=../editor/decimation.js --js=../editor/adaptive.js --js=../object/triangle.js --js=../object/states.js --js=../object/vertex.js --js=../gui/gui.js --js=../sculptgl.js --js_output_file=sculptgl/sculptgl.min.js
cp ../lib/*.js sculptgl/lib/
cp ../ressources/*.jpg sculptgl/ressources/
cp ../ressources/*.obj sculptgl/ressources/
cp ../shaders/*.glsl sculptgl/shaders/
cp ../css/*.css sculptgl/css/
cp index-min.html sculptgl/index.html
