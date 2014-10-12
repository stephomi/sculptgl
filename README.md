SculptGL (old version !)
========================

#### tl;dr : [The application](http://stephaneginier.com/archive/sculptgl0)

**SculptGL** is a web sculpting application, powered by WebGL and JavaScript.

It is a port from a previous C++ [school project](http://www.youtube.com/watch?v=wVrehtSl9g4) that I made at the University of Montréal as an exchange student.
You can find the C++ application [here](http://stephaneginier.com/archive/Sculpt3D.zip), (it uses Qt and I think I used GCC at that time, it's not rock solid anyway). It is less advanced than the web version, and I won't maintain it.

this SculptGL branch features **dynamic** and **adaptive** topological tools, as well as more classical sculpting tools, such as drag, brush or smooth for example.

Adaptive sculpting enables changes in the topological [genus](http://en.wikipedia.org/wiki/Genus_(mathematics)) (holes and merges).
The technique is based on [lucian stanculescu's freestyle paper](http://liris.cnrs.fr/lucian.stanculescu/).
**Inflate** is the best tools to trigger topological changes, but keep in mind that adaptive sculpting is somewhat buggy :) ... (don't use it with a mesh that already contains self-intersection or on the border of a mesh).

Right now, best performance are reached on Chrome.

Shortcuts so far :
 * 0-9 : sculpting tools
 * N : toggle negative
 * Ctrl+Z : undo
 * Ctrl+Y : redo
 * Arrow keys / zqsd/ wasd : fps-like movement
 * T, L, F : camera (Top, Left, Front)
 * Alt+Mouse : rotate camera
 * Alt+Ctrl+Mouse : zoom camera
 * Alt+Shift+Mouse : translate camera
