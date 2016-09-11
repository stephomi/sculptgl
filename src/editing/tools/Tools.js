import Enums from '../../misc/Enums';
import Brush from '../../editing/tools/Brush';
import Inflate from '../../editing/tools/Inflate';
import Twist from '../../editing/tools/Twist';
import Smooth from '../../editing/tools/Smooth';
import Flatten from '../../editing/tools/Flatten';
import Pinch from '../../editing/tools/Pinch';
import Crease from '../../editing/tools/Crease';
import Drag from '../../editing/tools/Drag';
import Paint from '../../editing/tools/Paint';
import Move from '../../editing/tools/Move';
import Masking from '../../editing/tools/Masking';
import LocalScale from '../../editing/tools/LocalScale';
import Transform from '../../editing/tools/Transform';

var Tools = [];

Tools[Enums.Tools.BRUSH] = Brush;
Tools[Enums.Tools.INFLATE] = Inflate;
Tools[Enums.Tools.TWIST] = Twist;
Tools[Enums.Tools.SMOOTH] = Smooth;
Tools[Enums.Tools.FLATTEN] = Flatten;
Tools[Enums.Tools.PINCH] = Pinch;
Tools[Enums.Tools.CREASE] = Crease;
Tools[Enums.Tools.DRAG] = Drag;
Tools[Enums.Tools.PAINT] = Paint;
Tools[Enums.Tools.MOVE] = Move;
Tools[Enums.Tools.MASKING] = Masking;
Tools[Enums.Tools.LOCALSCALE] = LocalScale;
Tools[Enums.Tools.TRANSFORM] = Transform;

Tools[Enums.Tools.BRUSH].uiName = 'sculptBrush';
Tools[Enums.Tools.INFLATE].uiName = 'sculptInflate';
Tools[Enums.Tools.TWIST].uiName = 'sculptTwist';
Tools[Enums.Tools.SMOOTH].uiName = 'sculptSmooth';
Tools[Enums.Tools.FLATTEN].uiName = 'sculptFlatten';
Tools[Enums.Tools.PINCH].uiName = 'sculptPinch';
Tools[Enums.Tools.CREASE].uiName = 'sculptCrease';
Tools[Enums.Tools.DRAG].uiName = 'sculptDrag';
Tools[Enums.Tools.PAINT].uiName = 'sculptPaint';
Tools[Enums.Tools.MOVE].uiName = 'sculptMove';
Tools[Enums.Tools.MASKING].uiName = 'sculptMasking';
Tools[Enums.Tools.LOCALSCALE].uiName = 'sculptLocalScale';
Tools[Enums.Tools.TRANSFORM].uiName = 'sculptTransform';

export default Tools;
