define([
  'lib/jQuery',
  'lib/FileSaver',
  'misc/Export'
], function ($, saveAs, Export) {

  'use strict';

  function GuiFiles(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; //main application
    this.keySketchfab_ = ''; //sketchfab api key
    this.init(guiParent);
  }

  GuiFiles.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var scene = this.sculptgl_.scene_;

      //file fold
      var foldFiles = guiParent.addFolder('Files (import/export)');
      foldFiles.add(scene, 'loadScene_').name('Reset sphere');
      foldFiles.add(this, 'openFile').name('Import (obj, ply, stl)');
      foldFiles.add(this, 'saveFileAsOBJ').name('Export (obj)');
      foldFiles.add(this, 'saveFileAsPLY').name('Export (ply)');
      foldFiles.add(this, 'saveFileAsSTL').name('Export (stl)');

      //Sketchfab fold
      var foldSketchfab = guiParent.addFolder('Go to Sketchfab !');
      foldSketchfab.add(this, 'keySketchfab_').name('API key');
      foldSketchfab.add(this, 'exportSketchfab').name('Upload');
    },
    /** Open file */
    openFile: function () {
      $('#fileopen').trigger('click');
    },
    /** Save file as OBJ*/
    saveFileAsOBJ: function () {
      var mesh = this.sculptgl_.multimesh_.getCurrent();
      if (!mesh)
        return;
      var blob = Export.exportOBJ(mesh);
      saveAs(blob, 'yourMesh.obj');
    },
    /** Save file as PLY */
    saveFileAsPLY: function () {
      var mesh = this.sculptgl_.multimesh_.getCurrent();
      if (!mesh)
        return;
      var blob = Export.exportPLY(mesh);
      saveAs(blob, 'yourMesh.ply');
    },
    /** Save file as STL */
    saveFileAsSTL: function () {
      var mesh = this.sculptgl_.multimesh_.getCurrent();
      if (!mesh)
        return;
      var blob = Export.exportSTL(mesh);
      saveAs(blob, 'yourMesh.stl');
    },
    /** Export to Sketchfab */
    exportSketchfab: function () {
      var mesh = this.sculptgl_.multimesh_.getCurrent();
      if (!mesh)
        return;
      if (this.keySketchfab_ === '') {
        window.alert('Please enter a sketchfab API Key.');
        return;
      }
      Export.exportSketchfab(mesh, this.keySketchfab_);
    }
  };

  return GuiFiles;
});