/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011 - 2015 OpenWorm.
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
package org.geppetto.frontend.messaging;

public class DefaultMessageSenderConfig {

	/**
	 * If true then use worker threads for processing and transmission. If false then do everything on calling thread.
	 */
	private boolean queuingEnabled = false;

	/**
	 * The maximum size of a processing or transmission queue. If the queue is full and
	 * <code>discardMessagesIfQueueFull</code> is true then the oldest item is removed from the queue to make space
	 * for the new item. If <code>discardMessagesIfQueueFull</code> is false then the calling thread runs the task
	 * itself.
	 */
	private int maxQueueSize = 5;

	/**
	 * If true and a queue is full then discard the oldest task to make room for the new task. If false then run
	 * the task in the calling thread.
	 */
	private boolean discardMessagesIfQueueFull = true;

	/**
	 * If true then compress messages.
	 */
	private boolean compressionEnabled = false;

	/**
	 * The minimum message size for compression. Messages smaller than this size are not compressed.
	 */
	private int minMessageLengthForCompression = 20000;

	public boolean isCompressionEnabled() {
		return compressionEnabled;
	}

	public void setCompressionEnabled(boolean compressionEnabled) {
		this.compressionEnabled = compressionEnabled;
	}

	public boolean isQueuingEnabled() {
		return queuingEnabled;
	}

	public void setQueuingEnabled(boolean queuingEnabled) {
		this.queuingEnabled = queuingEnabled;
	}

	public int getMaxQueueSize() {
		return maxQueueSize;
	}

	public void setMaxQueueSize(int maxQueueSize) {
		this.maxQueueSize = maxQueueSize;
	}

	public boolean getDiscardMessagesIfQueueFull() {
		return discardMessagesIfQueueFull;
	}

	public void setDiscardMessagesIfQueueFull(boolean discardMessagesIfQueueFull) {
		this.discardMessagesIfQueueFull = discardMessagesIfQueueFull;
	}

	public int getMinMessageLengthForCompression() {
		return minMessageLengthForCompression;
	}

	public void setMinMessageLengthForCompression(int minMessageLengthForCompression) {
		this.minMessageLengthForCompression = minMessageLengthForCompression;
	}

	public String toString() {
		return String.format("queuing enabled = %b, compression enabled = %b, discard messages if queue full = %b",
							 queuingEnabled, compressionEnabled, discardMessagesIfQueueFull);
	}
}
