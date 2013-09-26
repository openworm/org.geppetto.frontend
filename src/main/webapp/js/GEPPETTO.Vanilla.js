/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *     	OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * @fileoverview Geppetto Vanilla business logic
 * 
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 */

/**
 * Base class
 */
GEPPETTO.Vanilla = GEPPETTO.Vanilla ||
{
	REVISION : '1'
};

/**
 * Business logic for Geppetto Vanilla
 */
GEPPETTO.Vanilla.checkKeyboard = function()
{
	if (GEPPETTO.isKeyPressed("ctrl+alt+p"))
	{
		if (GEPPETTO.getPlots().length == 0)
		{
			GEPPETTO.addPlot("0", [ "hhpop[0].v", "hhpop[0].spiking", "hhpop[0].debugVal" ], -0.08, 0.05);
			GEPPETTO.addPlot("0", [ "hhpop[0].bioPhys1.membraneProperties.naChans.na.m.q", "hhpop[0].bioPhys1.membraneProperties.naChans.na.h.q", "hhpop[0].bioPhys1.membraneProperties.kChans.k.n.q" ], -0.1, 1.1);

		}
		else
		{
			while (GEPPETTO.getPlots().length > 0)
			{
				GEPPETTO.getPlots()[0].dispose();
			}
		}
	}
	
	else if(GEPPETTO.isKeyPressed("ctrl+alt+j")){
		GEPPETTO.Console.toggleConsole();
	}
};

$(document).ready(function()
{
	document.addEventListener("keydown", GEPPETTO.Vanilla.checkKeyboard, false);
});