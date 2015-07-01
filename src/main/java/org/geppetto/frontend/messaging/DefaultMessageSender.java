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

import java.io.IOException;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.catalina.websocket.WsOutbound;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.frontend.messages.GeppettoTransportMessage;
import org.geppetto.frontend.messages.OutboundMessages;
import org.geppetto.frontend.messages.TransportMessageFactory;

import com.google.gson.Gson;

/**
 * <code>DefaultMessageSender</code> handles transmission of messages to a client via WebSockets.
 *
 * Messages are first processed and compressed in a separate worker thread. Processed messages are then handed off to another (separate) worker thread that delivers the messages via the WebSocket.
 *
 * Each worker thread is backed by a blocking queue. One queue and thread provide messaging processing. The other queue and thread provide message transmission via the WebSocket.
 *
 * Queuing (and worker threads) and compression can be disabled. Without queuing DefaultMessageSender does not use worker threads and instead executes all tasks in the calling thread.
 *
 * Only message types specified in the queuedMessageTypes configuration are placed in the queues. All other message types are processed and transmitted in the calling thread.
 *
 * Queued message processing and transmission can be paused and resumed. When paused, the worker threads simply remove tasks from the queue and throw them away.
 *
 * Compression is done with gzip. The configuration parameter, <code>minMessageLengthForCompression</code> specifies the minimum message size for compression. Messages smaller than this size are not
 * compressed.
 *
 * {@link org.geppetto.frontend.controllers.GeppettoMessageInbound} loads the configuration via Spring from <code>app-config.xml</code>.
 */
public class DefaultMessageSender implements MessageSender
{

	/**
	 * If true then use worker threads for processing and transmission. If false then do everything on calling thread.
	 */
	private boolean queuingEnabled = false;

	/**
	 * The maximum size of a processing or transmission queue. If the queue is full and <code>discardMessagesIfQueueFull</code> is true then the oldest item is removed from the queue to make space for
	 * the new item. If <code>discardMessagesIfQueueFull</code> is false then the calling thread runs the task itself.
	 */
	private int maxQueueSize = 5;

	/**
	 * If true and a queue is full then discard the oldest task to make room for the new task. If false then run the task in the calling thread.
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

	/**
	 * Message types that should be queued - and thus handled across multiple threads. All other message types are handled on the calling thread.
	 */
	private Set<OutboundMessages> queuedMessageTypes;

	private ArrayBlockingQueue<Runnable> preprocessorQueue;
	private PausableThreadPoolExecutor preprocessorExecutor;
	private ArrayBlockingQueue<Runnable> senderQueue;
	private PausableThreadPoolExecutor senderExecutor;
	private WsOutbound wsOutbound;
	private Set<MessageSenderListener> listeners = new HashSet<>();

	private static final Log logger = LogFactory.getLog(DefaultMessageSender.class);

	public DefaultMessageSender()
	{
	}

	public void initialize(WsOutbound wsOutbound)
	{

		logger.info(String.format("Initializing message sender - queuing: %b, compression: %b, " + "discard messages if queues full: %b", queuingEnabled, compressionEnabled,
				discardMessagesIfQueueFull));

		this.wsOutbound = wsOutbound;

		if(queuingEnabled)
		{

			RejectedExecutionHandler rejectedExecutionHandler;

			if(discardMessagesIfQueueFull)
			{
				rejectedExecutionHandler = new ThreadPoolExecutor.DiscardOldestPolicy();
			}
			else
			{
				rejectedExecutionHandler = new ThreadPoolExecutor.AbortPolicy();
			}

			preprocessorQueue = new ArrayBlockingQueue<>(maxQueueSize);

			preprocessorExecutor = new PausableThreadPoolExecutor(1, 1, 30, TimeUnit.SECONDS, preprocessorQueue, rejectedExecutionHandler);

			preprocessorExecutor.prestartAllCoreThreads();

			senderQueue = new ArrayBlockingQueue<>(maxQueueSize);

			senderExecutor = new PausableThreadPoolExecutor(1, 1, 30, TimeUnit.SECONDS, senderQueue, rejectedExecutionHandler);
			senderExecutor.prestartAllCoreThreads();
		}
	}

	@Override
	public void shutdown()
	{
		logger.debug("Shutting down message sender");
		listeners = new HashSet<>();
		if(preprocessorExecutor != null)
		{
			preprocessorExecutor.shutdownNow();
		}
		if(senderExecutor != null)
		{
			senderExecutor.shutdownNow();
		}
	}

	/**
	 * Pause queued message transmission. This is a simple/crude way to maintain the responsiveness of the user interface. This method sets a flag that causes the worker threads to simply dequeue
	 * tasks and throw them away.
	 *
	 * Note that message types that don't utilize queueing are processed and transmitted normally regardless of whether the message sender is paused or not.
	 */
	@Override
	public void pause()
	{
		if(queuingEnabled)
		{
			senderExecutor.setPaused(true);
			preprocessorExecutor.setPaused(true);

			preprocessorQueue.clear();
			senderQueue.clear();
		}
	}

	@Override
	public void resume()
	{
		if(queuingEnabled)
		{
			preprocessorExecutor.setPaused(false);
			senderExecutor.setPaused(false);
		}
	}

	@Override
	public void reset()
	{
		if(queuingEnabled)
		{
			pause();
			preprocessorQueue.clear();
			senderQueue.clear();
			logger.debug("purged queues");
			resume();
		}
	}

	@Override
	public void addListener(MessageSenderListener listener)
	{
		listeners.add(listener);
	}

	@Override
	public void removeListener(MessageSenderListener listener)
	{
		listeners.remove(listener);
	}

	private void notifyListeners(MessageSenderEvent.Type eventType)
	{
		for(MessageSenderListener listener : listeners)
		{
			listener.handleMessageSenderEvent(new MessageSenderEvent(this, eventType));
		}
	}

	@Override
	public void sendMessage(String requestID, OutboundMessages messageType, String update)
	{

		try
		{

			if(queuingEnabled && isQueuedMessageType(messageType))
			{
				submitTask(preprocessorExecutor, new Preprocessor(requestID, messageType, update));

			}
			else
			{
				preprocessAndSendMessage(requestID, messageType, update);
			}

		}
		catch(Exception e)
		{
			logger.warn("failed to send binary message", e);
			notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
		}
	}

	private void preprocessAndSendMessage(String requestID, OutboundMessages messageType, String update) throws IOException
	{

		int uncompressedMessageSize = 0;

		if(update != null)
		{
			uncompressedMessageSize = update.length();
		}

		String message = preprocessMessage(requestID, messageType, update);

		if(!compressionEnabled || message.length() < minMessageLengthForCompression)
		{
			sendTextMessage(message, messageType);

		}
		else
		{
			byte[] compressedMessage = CompressionUtils.gzipCompress(message);
			sendBinaryMessage(compressedMessage, messageType, uncompressedMessageSize, false);
		}
	}

	private void preprocessMessageAndEnqueue(String requestId, OutboundMessages messageType, String update)
	{

		try
		{

			int uncompressedMessageSize = update.length();
			String message = preprocessMessage(requestId, messageType, update);

			if(!compressionEnabled || message.length() < minMessageLengthForCompression)
			{
				submitTask(senderExecutor, new TextMessageSender(message, messageType));

			}
			else
			{
				byte[] compressedMessage = CompressionUtils.gzipCompress(message);
				submitTask(senderExecutor, new BinaryMessageSender(compressedMessage, messageType, uncompressedMessageSize));
			}

		}
		catch(Exception e)
		{
			logger.warn("failed to process message before transmission", e);
			notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
		}
	}

	private String preprocessMessage(String requestId, OutboundMessages type, String update)
	{

		long startTime = System.currentTimeMillis();

		GeppettoTransportMessage transportMessage = TransportMessageFactory.getTransportMessage(requestId, type, update);

		logger.debug(String.format("created transport message in %dms", System.currentTimeMillis() - startTime));

		startTime = System.currentTimeMillis();
		String message = new Gson().toJson(transportMessage);
		logger.debug(String.format("created json in %dms", System.currentTimeMillis() - startTime));

		return message;
	}

	private void submitTask(ThreadPoolExecutor executor, Runnable task) throws InterruptedException
	{

		if(discardMessagesIfQueueFull)
		{
			executor.execute(task);
		}
		else
		{
			executor.getQueue().put(task);
		}
	}

	private void sendTextMessage(String message, OutboundMessages messageType)
	{

		try
		{

			long startTime = System.currentTimeMillis();
			CharBuffer buffer = CharBuffer.wrap(message);
			wsOutbound.writeTextMessage(buffer);
			if(messageType.equals("experiment_status"))
			{
				logger.info(String.format("sent text message - %s, length: %d bytes, took: %d ms", messageType, message.length(), System.currentTimeMillis() - startTime));
			}

		}
		catch(IOException e)
		{
			logger.warn("failed to send message", e);
			notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
		}
	}

	private void sendBinaryMessage(byte[] message, OutboundMessages messageType, int uncompressedMessageSize, boolean fromQueue)
	{
		try
		{
			long startTime = System.currentTimeMillis();

			// add to the buffer:
			// - type of message
			// - message
			int bufferSize = 1 + message.length;
			ByteBuffer buffer = ByteBuffer.allocate(bufferSize);
			buffer.put(BigInteger.valueOf(0).toByteArray());
			buffer.put(message);

			// ByteBuffer buffer = ByteBuffer.wrap(message);
			wsOutbound.writeBinaryMessage(buffer);

			String logMessage = "sent binary/compressed message - %s, length: %d (%d) bytes, duration: %d ms";
			if(fromQueue)
			{
				logMessage = "sent binary/compressed message from queue - %s, length: %d (%d) bytes, duration: %d ms";
			}

			logger.info(String.format(logMessage, messageType, message.length, uncompressedMessageSize, System.currentTimeMillis() - startTime));

		}
		catch(IOException e)
		{
			logger.warn("failed to send binary message", e);
			notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
		}
	}

	private boolean isQueuedMessageType(OutboundMessages messageType)
	{
		return queuedMessageTypes != null && queuedMessageTypes.contains(messageType);
	}

	public boolean isCompressionEnabled()
	{
		return compressionEnabled;
	}

	public void setCompressionEnabled(boolean compressionEnabled)
	{
		this.compressionEnabled = compressionEnabled;
	}

	public boolean isQueuingEnabled()
	{
		return queuingEnabled;
	}

	public void setQueuingEnabled(boolean queuingEnabled)
	{

		this.queuingEnabled = queuingEnabled;

		if(!queuingEnabled)
		{

			if(preprocessorQueue != null)
			{
				preprocessorQueue.clear();
			}
			if(senderQueue != null)
			{
				senderQueue.clear();
			}
		}
	}

	public int getMaxQueueSize()
	{
		return maxQueueSize;
	}

	public void setMaxQueueSize(int maxQueueSize)
	{
		this.maxQueueSize = maxQueueSize;
	}

	public boolean getDiscardMessagesIfQueueFull()
	{
		return discardMessagesIfQueueFull;
	}

	public void setDiscardMessagesIfQueueFull(boolean discardMessagesIfQueueFull)
	{
		this.discardMessagesIfQueueFull = discardMessagesIfQueueFull;
	}

	public int getMinMessageLengthForCompression()
	{
		return minMessageLengthForCompression;
	}

	public void setMinMessageLengthForCompression(int minMessageLengthForCompression)
	{
		this.minMessageLengthForCompression = minMessageLengthForCompression;
	}

	public Set<OutboundMessages> getQueuedMessageTypes()
	{
		return queuedMessageTypes;
	}

	public void setQueuedMessageTypes(Set<OutboundMessages> queuedMessageTypes)
	{
		this.queuedMessageTypes = queuedMessageTypes;
	}

	private class TextMessageSender implements Runnable
	{

		private String message;
		private OutboundMessages messageType;

		public TextMessageSender(String message, OutboundMessages messageType)
		{
			this.message = message;
			this.messageType = messageType;
		}

		public void run()
		{
			sendTextMessage(message, messageType);
		}
	}

	private class BinaryMessageSender implements Runnable
	{

		private byte[] message;
		private OutboundMessages messageType;
		private int uncompressedMessageSize;

		public BinaryMessageSender(byte[] message, OutboundMessages messageType, int uncompressedMessageSize)
		{
			this.message = message;
			this.messageType = messageType;
			this.uncompressedMessageSize = uncompressedMessageSize;
		}

		public void run()
		{
			sendBinaryMessage(message, messageType, uncompressedMessageSize, true);
		}
	}

	private class Preprocessor implements Runnable
	{

		private String requestId;
		private OutboundMessages type;
		private String update;

		public Preprocessor(String requestId, OutboundMessages type, String update)
		{
			this.requestId = requestId;
			this.type = type;
			this.update = update;
		}

		public void run()
		{
			preprocessMessageAndEnqueue(requestId, type, update);
		}
	}
}
