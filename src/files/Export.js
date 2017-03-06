import ExportOBJ from 'files/ExportOBJ';
import ExportSGL from 'files/ExportSGL';
import ExportPLY from 'files/ExportPLY';
import ExportSTL from 'files/ExportSTL';
import ExportSketchfab from 'files/ExportSketchfab';

var Export = {};
Export.exportOBJ = ExportOBJ.exportOBJ;
Export.exportSGL = ExportSGL.exportSGL;
Export.exportAsciiPLY = ExportPLY.exportAsciiPLY;
Export.exportBinaryPLY = ExportPLY.exportBinaryPLY;
Export.exportAsciiSTL = ExportSTL.exportAsciiSTL;
Export.exportBinarySTL = ExportSTL.exportBinarySTL;
Export.exportSketchfab = ExportSketchfab.exportSketchfab;

export default Export;
