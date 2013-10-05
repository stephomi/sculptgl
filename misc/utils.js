var Utils = {};

/** Return the nearest power of two value */
Utils.nextHighestPowerOfTwo = function (x)
{
	--x;
	for (var i = 1; i < 32; i <<= 1)
		x = x | x >> i;
	return x + 1;
};

/** sort an array and delete duplicate values */
Utils.tidy = function (array)
{
	array.sort(function (a, b)
	{
		return a - b;
	});
	var len = array.length;
	var i = 0,
		j = 0;
	for (i = 1; i < len; ++i)
	{
		if (array[j] !== array[i])
			array[++j] = array[i];
	}
	if (i > 1)
		array.length = j + 1;
};

/** Intersection between two arrays*/
Utils.intersectionArrays = function (a, b)
{
	var ai = 0,
		bi = 0;
	var result = [];

	var aLen = a.length,
		bLen = b.length;
	while (ai < aLen && bi < bLen)
	{
		if (a[ai] < b[bi]) ai++;
		else if (a[ai] > b[bi]) bi++;
		else
		{
			result.push(a[ai]);
			++ai;
			++bi;
		}
	}
	return result;
};

/** Array rotation */
Utils.rotateArray = function (array, inc)
{
	inc = -inc;
	for (var l = array.length, inc = (Math.abs(inc) >= l && (inc %= l), inc < 0 && (inc += l), inc), i, x; inc; inc = (Math.ceil(l / inc) - 1) * inc - l + (l = inc))
	{
		for (i = l; i > inc; x = array[--i], array[i] = array[i - inc], array[i - inc] = x)
		{}
	}
	return array;
};

var Tablet = {};

/** wacom tablet plugin element **/
Tablet.plugin = document.querySelector('object[type=\'application/x-wacomtabletplugin\']');

/** Returns the pressure of pen: [0, 1] **/
Tablet.pressure = function ()
{
	var pen;
	if (Tablet.plugin)
		pen = Tablet.plugin.penAPI;
	return (pen && pen.pointerType) ? pen.pressure : 1;
};

/** endsWith function */
if (typeof String.prototype.endsWith !== 'function')
{
	String.prototype.endsWith = function (str)
	{
		return this.slice(-str.length) === str;
	};
}

/** startsWith function */
if (typeof String.prototype.startsWith !== 'function')
{
	String.prototype.startsWith = function (str)
	{
		return this.slice(0, str.length) === str;
	};
}